import * as React from "react";
import { useState, useEffect, useMemo, createContext } from "react";
import { render } from "react-dom";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  NavLink,
  Link,
  useNavigate,
} from "react-router-dom";
import { useTransition, animated, config as springConfig } from "react-spring";
import { Container, Navbar, Nav, NavDropdown } from "react-bootstrap";
import { Web3ReactProvider } from "@web3-react/core";
import Web3 from "web3";
import StatusAlert from "react-status-alert";

import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap-css-only/css/bootstrap.min.css";
import "mdbreact/dist/css/mdb.css";
import "../node_modules/react-status-alert/dist/status-alert.css";
import "./styles.css";

import "regenerator-runtime/runtime";

import About from "./components/about";
import Landing from "./pages/landing";

const Navigation = () => {
  return (
    <Navbar id="navigation" className="fixed-top" style={{ width: "100vw" }}>
      {/* <Nav>
        <Nav.Link as={NavLink} to="/">
          Home
        </Nav.Link>
        <Nav.Link as={NavLink} to="/about">
          About the coin
        </Nav.Link>
        <Nav.Link as={NavLink} to="/team">
          About the team
        </Nav.Link>
        <Nav.Link as={NavLink} to="/buy">
          Buy
        </Nav.Link>
      </Nav> */}
      <About className="ml-auto" />
    </Navbar>
  );
};

const routes = ["/"];
let routeIndex = 0;

let wheelAccumulator = 0;
// Idk about these numbers, but they seem to work for me.
const wheelAccumulatorInterval = 400;
const wheelAccumulatorDelta = 40;
const wheelAccumulatorThreshold = 130;
const wheelTimeout = 400;
let wheelHasTriggered = false;

const MyRoutes = (compProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  routeIndex = routes.indexOf(location.pathname);

  const [directionStyle, setDirectionStyle] = useState<{
    top?: string;
    bottom?: string;
  }>({ top: "0px" });

  // page delta must be > -route.length
  const transitionPage = (pageDelta) => {
    if (routes.length === 1) return;
    if (pageDelta == 0) return;
    if (pageDelta > 0) {
      setDirectionStyle({ top: "0px" });
    } else {
      setDirectionStyle({ bottom: "0px" });
    }
    routeIndex = (routeIndex - pageDelta + routes.length) % routes.length;
    navigate(routes[routeIndex]);
  };

  const downHandler = (e) => {
    if (e.key === "PageDown" || e.key === "ArrowDown") {
      transitionPage(-1);
    } else if (e.key === "PageUp" || e.key === "ArrowUp") {
      transitionPage(1);
    }
  };

  useEffect(() => {
    console.log("Mounted (I should only see this once)");
    setInterval(() => {
      if (wheelAccumulator > 0) {
        wheelAccumulator -= wheelAccumulatorDelta;
        if (wheelAccumulator < 0) {
          wheelAccumulator = 0;
        }
      } else if (wheelAccumulator < 0) {
        wheelAccumulator += wheelAccumulatorDelta;
        if (wheelAccumulator > 0) {
          wheelAccumulator = 0;
        }
      }
    }, wheelAccumulatorInterval);
    window.addEventListener("keydown", downHandler);
    return () => {
      window.removeEventListener("keydown", downHandler);
    };
  }, []);

  const transitions = useTransition(location, {
    from: { opacity: 0, zoom: 0 },
    enter: { opacity: 1, zoom: 1 },
    leave: { opacity: 0, zoom: 0 },
    delay: 100,
    config: springConfig.gentle,
  });

  return transitions((props, item) => (
    <div id="page">
      <animated.div
        tabIndex={0}
        style={{
          ...{
            height: props.zoom
              .to({ range: [0.0, 1.0], output: [0.3, 1] })
              .to((x: number) => `${x * 100}%`),
            position: "absolute",
            width: "100vw",
            opacity: props.opacity.to({ range: [0.0, 1.0], output: [0, 1] }),
            transform: props.zoom
              .to({ range: [0.0, 1.0], output: [0.3, 1] })
              .to((x: number) => `scale(${x})`),
          },
          ...directionStyle,
        }}
        onScroll={(e) => e.preventDefault()}
        onWheel={(e) => {
          wheelAccumulator += e.deltaY;
          if (Math.abs(wheelAccumulator) > wheelAccumulatorThreshold) {
            if (!wheelHasTriggered) {
              wheelHasTriggered = true;
              setTimeout(() => {
                wheelHasTriggered = false;
              }, wheelTimeout);
              if (wheelAccumulator < 0) {
                transitionPage(1);
              } else {
                transitionPage(-1);
              }
            }
            wheelAccumulator = 0;
          }
        }}
      >
        <Routes location={item}>
          <Route path="/" element={<Landing />} />
        </Routes>
      </animated.div>
    </div>
  ));
};

export default function App() {
  return (
    <Web3ReactProvider
      getLibrary={(prov) => {
        const library = new Web3(prov);
        console.dir("provider", prov);
        return library;
      }}
    >
      <StatusAlert />
      <BrowserRouter>
        <Navigation />
        <MyRoutes />
      </BrowserRouter>
    </Web3ReactProvider>
  );
}

export function renderToDom(container) {
  render(<App />, container);
}
