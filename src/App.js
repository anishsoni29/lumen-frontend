import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeUp, faStop } from '@fortawesome/free-solid-svg-icons'; 
import './styles/App.css';

function App() {
  const [description, setDescription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false); 
  const [stream, setStream] = useState(null); // Camera stream state
  const videoRef = useRef(null); // Video element for camera view

  useEffect(() => {
    return () => {
      // Cleanup: Stop the camera stream when the component is unmounted
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleCaptureAndDescribe = async (transcript) => {
    setIsLoading(true); 
    const response = await fetch("http://localhost:5001/generate-description", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_input: transcript }),
    });

    if (response.ok) {
      const data = await response.json();
      setDescription(data.description);
      setUserInput(""); 

      const speech = new SpeechSynthesisUtterance(data.description);
      speech.lang = 'en-US'; 
      window.speechSynthesis.speak(speech); 
    } else {
      console.error('Error generating description:', response.statusText);
    }
    setIsLoading(false); 
  };

  const toggleVoiceRecognition = () => {
    if (!isRecording) {
      startCamera(); // Start the camera when voice recording begins
      startRecognition();
    } else {
      stopCamera(); // Stop the camera when voice recording stops
    }
  };

  const startRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.onstart = () => {
      setIsRecording(true);
      console.log('Voice recognition started. Try speaking into the microphone.');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript); 
      handleCaptureAndDescribe(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Error occurred in recognition: ' + event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      console.log('Voice recognition ended.');
      stopCamera(); // Stop the camera when voice recognition ends
    };

    recognition.start();
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop()); // Stop all media tracks
      setStream(null); // Clear the stream state
    }
  }

  return (
    <div className="app-container">
      <header>
      <h1 className="digital-font ">Lumen: Vision for All</h1>
      </header>


      <main>
        <div className="input-card">
          <button onClick={toggleVoiceRecognition} className="record-btn">
            {isRecording ? (
              <>
                Stop Recording <FontAwesomeIcon icon={faStop} />
              </>
            ) : (
              <>
                Start Recording <FontAwesomeIcon icon={faVolumeUp} />
              </>
            )}
          </button>
          <textarea
            className="input-area"
            value={userInput}
            readOnly
            placeholder="Your speech will appear here..."
            rows={4}
          />
        </div>

        {/* Camera view section */}
        <section className="camera-section">
          {stream && (
            <div className="camera-view">
              <video ref={videoRef} autoPlay playsInline className="video-element" />
            </div>
          )}
        </section>

        <section className="description-section">
          {isLoading ? (
            <div className="loading-container">
              <div className="loader"></div>
              <p>Generating description...</p>
            </div>
          ) : (
            <div className="description-box">
              <h2>{description ? `Description: ${description}` : "No description yet."}</h2>
            </div>
          )}
        </section>
      </main>
      <footer>
        <p>designed with *Accessibility* in mind</p>
        <p>we're open source. check us out on <a href="https://github.com/anishsoni29/Lumen" target="_blank">github</a></p>
      </footer>
    </div>
  );
}

export default App;