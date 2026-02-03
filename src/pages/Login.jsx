import { useState } from "react";
import axios from "axios";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { serverEndpoint } from "../config/appConfig";

function Login({ setUser }) {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");

    const handleChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;

        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const validate = () => {
        let newErrors = {};
        let isValid = true;

        if (formData.email.length === 0) {
            newErrors.email = "Email is required";
            isValid = false;
        }

        if (formData.password.length === 0) {
            newErrors.password = "Password is required";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleFormSubmit = async (event) => {
        // Prevent default behaviour of form which is to do complete page reload.
        event.preventDefault();

        if (validate()) {
            try {
                const body = {
                    email: formData.email,
                    password: formData.password,
                };
                const config = { withCredentials: true };
                const response = await axios.post(
                    `${serverEndpoint}/auth/login`,
                    body,
                    config
                );
                setUser(response.data.user);
            } catch (error) {
                console.log(error);
                setErrors({
                    message: "Something went wrong, please try again",
                });
            }
        }
    };

    const handleGoogleSuccess = async (authResponse) => {
        try {
            const body = {
                idToken: authResponse?.credential,
            };
            const response = await axios.post(
                `${serverEndpoint}/auth/google-auth`,
                body,
                { withCredentials: true }
            );
            setUser(response.data.user);
        } catch (error) {
            console.log(error);
            setErrors({ message: 'Unable to process google sso, please try again' });
        }
    };

    const handleGoogleFailure = (error) => {
        console.log(error);
        setErrors({
            message:
                "Something went wrong while performing google single sign-on",
        });
    };

    return (
        <div className="container text-center">
            <h3>Login to continue</h3>
            {message && message}
            {errors.message && errors.message}

            <div className="row justify-content-center">
                <div className="col-6">
                    <form onSubmit={handleFormSubmit}>
                        <div>
                            <label>Email:</label>
                            <input
                                className="form-control"
                                type="text"
                                name="email"
                                onChange={handleChange}
                            />
                            {errors.email && errors.email}
                        </div>

                        <div>
                            <label>Password:</label>
                            <input
                                className="form-control"
                                type="password"
                                name="password"
                                onChange={handleChange}
                            />
                            {errors.password && errors.password}
                        </div>

                        <div>
                            <button className="btn btn-primary">Login</button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="row justify-content-center">
                <div className="col-6">
                    <GoogleOAuthProvider
                        clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
                    >
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleFailure}
                        />
                    </GoogleOAuthProvider>
                </div>
            </div>
        </div>
    );
}

export default Login;
