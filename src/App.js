import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import { useLocalStorageState } from "./hooks/useLocalStorageState";

import { showMessage } from "./actions";
import { addListener, gotMessage } from "./socket";

// screens
import LoginScreen from "./Login.screen";
import GeneralRoomScreen from "./GeneralRoom.screen";
import PrivateRoomScreen from "./PrivateRoom.screen";

import "./App.css";

function App() {
  // user and authentication  state
  const [logged, setLogged] = useLocalStorageState("logged", false);
  const [user, setUser] = useLocalStorageState("user", { name: "", id: "" });

  // global messages state
  const [messages, setMessages] = useLocalStorageState("messages", []);
  const messagesRef = React.useRef(messages);
  const setMessagesRef = (data) => {
    messagesRef.current = data;
    setMessages(data);
  };

  const socket = React.useRef(null);

  React.useEffect(() => {
    // initialize the socket instance
    socket.current = new WebSocket("ws://localhost:8999");
    socket.current.binaryType = "arraybuffer";
    // Connection opened
    socket.current.addEventListener("open", function (event) {
      socket.current.send("Hello Server!");
    });
    //  Listen for messages
    socket.current.addEventListener("message", function (event) {
      gotMessage(event);
    });
    // listen to chat messages
    addListener("c", receiveChat);
    // listen to status messages
    addListener("+", receiveStatus);

    return () => socket.current.close();
  }, []);

  // handle Logout
  const clearUser = () => {
    setUser({ name: "", id: "" });
    setMessagesRef([]);
    setLogged(false);
  };

  // handle received chat message
  const receiveChat = React.useCallback((namespace, data) => {
    showMessage(messagesRef.current, setMessagesRef, data.toString());
  }, []);

  // handle received status message
  const receiveStatus = React.useCallback((namespace, data) => {
    showMessage(messagesRef.current, setMessagesRef, data.toString(), "status");
  }, []);

  return (
    <Router>
      <div className="chat-container">
        <Switch>
          {logged ? (
            <>
              <Route path="/general">
                <GeneralRoomScreen
                  socket={socket}
                  user={user}
                  messages={messages}
                  messagesRef={messagesRef}
                  setMessagesRef={setMessagesRef}
                  clearUser={clearUser}
                />
              </Route>
              <Route path="/private/:id">
                <PrivateRoomScreen
                  socket={socket}
                  user={user}
                  messages={messages}
                  messagesRef={messagesRef}
                  setMessagesRef={setMessagesRef}
                  clearUser={clearUser}
                />
              </Route>
              <Route>
                <Redirect to="/general" />
              </Route>
            </>
          ) : (
            <>
              <Route exact path="/login">
                <LoginScreen
                  setUser={setUser}
                  setLogged={setLogged}
                  socket={socket}
                  user={user}
                  messages={messages}
                  messagesRef={messagesRef}
                  setMessagesRef={setMessagesRef}
                />
              </Route>
              <Route>
                <Redirect to="/login" />
              </Route>
            </>
          )}
        </Switch>
      </div>
    </Router>
  );
}

export default App;
