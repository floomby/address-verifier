import React, { useState } from "react";
import { injected } from "./connector";
import { Button, Modal } from "react-bootstrap";

import { StatusAlertService } from "react-status-alert";

const About = (props) => {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <Button variant="primary" onClick={handleShow} {...props}>
        About
      </Button>

      <Modal show={show} onHide={handleClose} size="lg" centered>
        <Modal.Header>
          <Modal.Title>About</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            You see that id up in the url? That is a unique value for you to
            sign. Once you sign the message with your wallet it will communicate
            back to the backend which is running the bot and verify the address
            used to sign the message.
          </p>
          <p>
            If you get a verification error then you have either waited to long
            to open this link or you have already verified this address.
          </p>
        </Modal.Body>
        {/* <Modal.Footer>
          <Button variant="primary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer> */}
      </Modal>
    </>
  );
};

export default About;
