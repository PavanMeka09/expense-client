import { useEffect, useState } from "react";
import { serverEndpoint } from "../config/appConfig";
import axios from "axios";

function ManageUsers() {
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Select",
  });
  const [editFormData, setEditFormData] = useState({
    name: "",
    role: "Select",
  });

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

  const handleChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validate = () => {
    let isValid = true;
    let newErrors = {};

    if (formData.name.length === 0) {
      isValid = false;
      newErrors.name = "Name is required";
    }

    if (formData.email.length === 0) {
      isValid = false;
      newErrors.email = "Email is required";
    }

    if (formData.role === "Select") {
      isValid = false;
      newErrors.role = "Role is required";
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateEditForm = () => {
    let isValid = true;
    let newErrors = {};

    if (editFormData.name.trim().length === 0) {
      isValid = false;
      newErrors.editName = "Name is required";
    }

    if (editFormData.role === "Select") {
      isValid = false;
      newErrors.editRole = "Role is required";
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validate()) {
      setActionLoading(true);
      setMessage(null);
      try {
        const response = await axios.post(
          `${serverEndpoint}/users/`,
          {
            name: formData.name,
            email: formData.email,
            role: formData.role,
          },
          { withCredentials: true }
        );

        setUsers((currentUsers) => [...currentUsers, response.data.user]);
        setFormData({
          name: "",
          email: "",
          role: "Select",
        });
        setErrors({});
        setMessage("User added!");
      } catch (error) {
        console.log(error);
        setErrors({ message: "Unable to add user, please try again" });
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleEditClick = (user) => {
    setMessage(null);
    setErrors({});
    setEditingUserId(user._id);
    setEditFormData({
      name: user.name,
      role: user.role,
    });
  };

  const handleEditChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setEditFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditFormData({
      name: "",
      role: "Select",
    });
    setErrors({});
  };

  const handleUpdateUser = async (userId) => {
    if (!validateEditForm()) {
      return;
    }

    setUpdatingUserId(userId);
    setMessage(null);
    try {
      await axios.patch(
        `${serverEndpoint}/users/`,
        {
          userId: userId,
          name: editFormData.name.trim(),
          role: editFormData.role,
        },
        { withCredentials: true }
      );

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user._id === userId
            ? {
                ...user,
                name: editFormData.name.trim(),
                role: editFormData.role,
              }
            : user
        )
      );
      setEditingUserId(null);
      setEditFormData({
        name: "",
        role: "Select",
      });
      setErrors({});
      setMessage("User updated!");
    } catch (error) {
      console.log(error);
      setErrors({ message: "Unable to update user, please try again" });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingUserId(userId);
    setMessage(null);
    setErrors({});
    try {
      await axios.post(
        `${serverEndpoint}/users/delete`,
        {
          userId: userId,
        },
        { withCredentials: true }
      );

      setUsers((currentUsers) =>
        currentUsers.filter((user) => user._id !== userId)
      );
      if (editingUserId === userId) {
        setEditingUserId(null);
      }
      setMessage("User deleted!");
    } catch (error) {
      console.log(error);
      setErrors({ message: "Unable to delete user, please try again" });
    } finally {
      setDeletingUserId(null);
    }
  };

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
      {errors.message && (
        <div className="alert alert-danger" role="alert">
          {errors.message}
        </div>
      )}

      {message && (
        <div className="alert alert-success" role="alert">
          {message}
        </div>
      )}
      <div className="row">
        {/* Add user form placeholder */}
        <div className="col-md-3"></div>
        <div className="card shadow-sm">
          <div className="card-header">
            <h5>Add Member</h5>
          </div>

          <div className="card-body p-2">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  name="name"
                  className={
                    errors.name
                      ? `form-control is-invalid`
                      : `form-control`
                  }
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && (
                  <div className="invalid-feedback ps-1">
                    {errors.name}
                  </div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="text"
                  name="email"
                  className={
                    errors.email
                      ? `form-control is-invalid`
                      : `form-control`
                  }
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <div className="invalid-feedback ps-1">
                    {errors.email}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label">Role</label>
                <select
                  name="role"
                  className={
                    errors.role
                      ? `form-select is-invalid`
                      : `form-select`
                  }
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="Select">Select</option>
                  <option value="manager">Manager</option>
                  <option value="viewer">Viewer</option>
                </select>
                {errors.role && (
                  <div className="invalid-feedback ps-1">
                    {errors.role}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <button className="btn btn-primary w-100">
                  {actionLoading ? (
                    <div
                      className="spinner-border"
                      role="status"
                    >
                      <span className="visually-hidden">
                        Loading...
                      </span>
                    </div>
                  ) : (
                    <>Add</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

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
                      users.map((user) => {
                        const isEditingUser = editingUserId === user._id;
                        const isUpdatingUser = updatingUserId === user._id;
                        const isDeletingUser = deletingUserId === user._id;

                        return (
                          <tr key={user._id}>
                            <td className="align-middle">
                              {isEditingUser ? (
                                <>
                                  <input
                                    type="text"
                                    name="name"
                                    className={
                                      errors.editName
                                        ? "form-control form-control-sm is-invalid"
                                        : "form-control form-control-sm"
                                    }
                                    value={editFormData.name}
                                    onChange={handleEditChange}
                                  />
                                  {errors.editName && (
                                    <div className="invalid-feedback d-block">
                                      {errors.editName}
                                    </div>
                                  )}
                                </>
                              ) : (
                                user.name
                              )}
                            </td>
                            <td className="align-middle">{user.email}</td>
                            <td className="align-middle">
                              {isEditingUser ? (
                                <>
                                  <select
                                    name="role"
                                    className={
                                      errors.editRole
                                        ? "form-select form-select-sm is-invalid"
                                        : "form-select form-select-sm"
                                    }
                                    value={editFormData.role}
                                    onChange={handleEditChange}
                                  >
                                    <option value="Select">Select</option>
                                    <option value="manager">Manager</option>
                                    <option value="viewer">Viewer</option>
                                  </select>
                                  {errors.editRole && (
                                    <div className="invalid-feedback d-block">
                                      {errors.editRole}
                                    </div>
                                  )}
                                </>
                              ) : (
                                user.role
                              )}
                            </td>
                            <td className="align-middle">
                              {isEditingUser ? (
                                <>
                                  <button
                                    className="btn btn-link text-primary"
                                    disabled={isUpdatingUser}
                                    onClick={() => handleUpdateUser(user._id)}
                                  >
                                    {isUpdatingUser ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    className="btn btn-link text-secondary"
                                    disabled={isUpdatingUser}
                                    onClick={handleCancelEdit}
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="btn btn-link text-primary"
                                    onClick={() => handleEditClick(user)}
                                    disabled={
                                      deletingUserId !== null ||
                                      updatingUserId !== null
                                    }
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-link text-danger"
                                    onClick={() => handleDeleteUser(user._id)}
                                    disabled={
                                      isDeletingUser || updatingUserId !== null
                                    }
                                  >
                                    {isDeletingUser ? "Deleting..." : "Delete"}
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
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
