import React, { useEffect, useState } from "react";
import {
  Tooltip,
  Container,
  Button,
  Nav,
  Row,
  Col,
  Form,
  FloatingLabel,
  OverlayTrigger,
} from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { MDBCol, MDBRow } from "mdb-react-ui-kit";
import { StatusAlertService } from "react-status-alert";
import { injected } from "../components/connector";
// import { config as springConfig } from "react-spring";
import TextTransition, { presets } from "react-text-transition";

import Web3 from "web3";
import { useWeb3React } from "@web3-react/core";
import { backendUrl } from "../../config";

const Landing = (props) => {
  const { activate, deactivate, library, active, account } = useWeb3React();
  // 0 - connect
  // 1 - sign message
  // 2 - verified
  // 3 - failed verification
  const [step, setStep] = useState(0);

  const connect = async () => {
    try {
      await activate(injected, undefined, true);
      // StatusAlertService.showSuccess("Successfully connected");
    } catch (err) {
      StatusAlertService.showError("Failed to connect to wallet provider");
      console.error(err);
    }
  };

  const disconnect = () => {
    try {
      deactivate();
      StatusAlertService.showSuccess("Successfully disconnected");
    } catch (err) {
      StatusAlertService.showError("Failed to disconnect from wallet provider");
      console.error(err);
    }
  };

  useEffect(() => {
    (async () => {
      await connect();
    })();
  }, []);

  useEffect(() => {
    if (!active) {
      return;
    }
    (async () => {
      setStep(1);
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      const id = urlParams.get("id");
      const web3 = library as Web3;
      const signature = await web3.eth.personal.sign(id, account, "");
      fetch(`${backendUrl}verify?id=${id}&signature=${signature}`)
        .then((response) => {
          if (!response.ok)
            throw new Error("Unable to access backend: " + response.status);
          return response.json();
        })
        .then((json) => {
          if (json.success) {
            setStep(2);
            // StatusAlertService.showSuccess("Verification successful");
          } else {
            setStep(3);
            StatusAlertService.showError("Verification failed");
          }
        })
        .catch(console.error.bind("Error: "))
        .catch(console.error.bind("Error: "));
    })();
  }, [active]);

  const messages = [
    "Connect wallet",
    "Sign message",
    "Verification successfully",
    "Verification failed",
  ];

  return (
    <>
      <Container
        id="landing"
        fluid
        style={{ height: "100%" }}
        className="d-flex justify-content-around align-items-center "
      >
        <div className="center">
          <h2>
            <TextTransition
              inline
              className="transition-text center-text"
              text={ messages[step] }
              springConfig={ presets.wobbly }
            />
          </h2>
        </div>
        </Container>
    </>
  );
};

export default Landing;
