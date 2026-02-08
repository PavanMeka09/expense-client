import { useEffect, useState } from "react";
import { serverEndpoint } from "../config/appConfig";
import axios from "axios";

function ManageUsers() {
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${serverEndpoint}/users/`, {
        withCredentials: true,
      });
      setUsers(response.data.users);
    } catch (error) {
      console.log(error);
      setErrors({ message: "Unable to fetch users, please try again" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="container p-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-5 px-4 px-md-5">
      {errors.message && (
        <div className="alert alert-danger" role="alert">
          {errors.message}
        </div>
      )}

      <div className="row align-items-center mb-5">
        <div className="col-md-8 text-center text-md-start mb-3 mb-md-0">
          <h2 className="fw-bold text-dark display-6">
            Manage <span className="text-primary">Users</span>
          </h2>
          <p className="text-muted mb-0">
            View and manage all the users along with their permissions
          </p>
        </div>
      </div>

      <div className="row">
        {/* Add user form placeholder */}
        <div className="col-md-3"></div>

        {/* Users table */}
        <div className="col-md-9">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5>Team Members</h5>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="text-center">Name</th>
                      <th className="text-center">Email</th>
                      <th className="text-center">Role</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-muted">
                          No users found. Start by adding one!
                        </td>
                      </tr>
                    )}

                    {users.length > 0 &&
                      users.map((user) => (
                        <tr key={user._id}>
                          <td className="align-middle">{user.name}</td>
                          <td className="align-middle">{user.email}</td>
                          <td className="align-middle">{user.role}</td>
                          <td className="align-middle">
                            <button className="btn btn-link text-primary">
                              Edit
                            </button>
                            <button className="btn btn-link text-danger">
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManageUsers;
