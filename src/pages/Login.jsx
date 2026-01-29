import { useState } from "react";
import axios from 'axios';

function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState('');

    const handleChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;

        setFormData({
            ...formData,
            [name]: value
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
                const response = await axios.post('http://localhost:5001/auth/login', body, config);
                console.log(response);
                setMessage('User authenticated');
            } catch (error) {
                console.log(error);
                setErrors({
                    message: 'Something went wrong, please try again'
                })
            }
        }
    };

    return (
        <div className="container text-center">
            <h3>Login to continue</h3>
            {message && (message)}
            {errors.message && (errors.message)}

            <form onSubmit={handleFormSubmit}>
                <div>
                    <label>Email:</label>
                    <input 
                        className="form-control" 
                        type='text' 
                        name="email"
                        onChange={handleChange}
                    />
                    {errors.email && (errors.email)}
                </div>

                <div>
                    <label>Password:</label>
                    <input 
                        className="form-control" 
                        type='password' 
                        name="password" 
                        onChange={handleChange}
                    />
                    {errors.password && (errors.password)}
                </div>

                <div>
                    <button className="btn btn-primary">Login</button>
                </div>
            </form>
        </div>
    );
}

export default Login;
