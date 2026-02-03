import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AppLayout from "./components/AppLayout";
import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import Logout from "./pages/Logout";
import UserLayout from "./components/UserLayout";
import axios from "axios";
import { serverEndpoint } from "./config/appConfig";

function App() {
    // Value of userDetails represents whether the user
    // is logged in or not.
    const [userDetails, setUserDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    const isUserLoggedIn = async () => {
        try {
            const response = await axios.post(`${serverEndpoint}/auth/is-user-logged-in`, 
                {}, { withCredentials: true });
            
            setUserDetails(response.data.user);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        isUserLoggedIn();
    }, []);

    if (loading) {
        return (
            <div className="container text-center">
                <h3>Loading...</h3>
            </div>
        );
    }

    return (
        <Routes>
            <Route
                path="/"
                element={
                    userDetails ? (
                        <Navigate to="/dashboard" />
                    ) : (
                        <AppLayout>
                            <Home />
                        </AppLayout>
                    )
                }
            />
            <Route
                path="/login"
                element={
                    userDetails ? (
                        <Navigate to="/dashboard" />
                    ) : (
                        <AppLayout>
                            <Login setUser={setUserDetails} />
                        </AppLayout>
                    )
                }
            />

            <Route
                path="/dashboard"
                element={
                    userDetails ? (
                        <UserLayout user={userDetails}>
                            <Dashboard user={userDetails} />
                        </UserLayout>
                    ) : (
                        <Navigate to="/login" />
                    )
                }
            />

            <Route
                path="/logout"
                element={
                    userDetails ? (
                        <Logout setUser={setUserDetails} />
                    ) : (
                        <Navigate to="/login" />
                    )
                }
            />
        </Routes>
    );
}

export default App;
