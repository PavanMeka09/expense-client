import axios from "axios";
import { serverEndpoint } from "../config/appConfig";
import { useEffect, useState } from "react";
import GroupCard from "../components/GroupCard";
import CreateGroupModal from "../components/CreateGroupModal";

function Groups() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [show, setShow] = useState(false);

    const fetchGroups = async () => {
        try {
            const response = await axios.get(
                `${serverEndpoint}/groups/my-groups`,
                { withCredentials: true }
            );
            setGroups(response.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGroupUpdateSuccess = (data) => {
        setGroups((prevGroups) => {
            const exists = prevGroups.some((group) => group._id === data._id);
            if (exists) {
                return prevGroups.map((group) =>
                    group._id === data._id ? data : group
                );
            } else {
                return [data, ...prevGroups];
            }
        });
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    if (loading) {
        return (
            <div
                className="container p-5 d-flex flex-column align-items-center justify-content-center"
                style={{ minHeight: "60vh" }}
            >
                <div
                    className="spinner-grow text-primary"
                    role="status"
                    style={{ width: "3rem", height: "3rem" }}
                >
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted fw-medium">
                    Syncing your circles...
                </p>
            </div>
        );
    }

    return (
        <div className="container py-5 px-4 px-md-5">
            <div className="row align-items-center mb-5">
                <div className="col-md-8 text-center text-md-start mb-3 mb-md-0">
                    <h2 className="fw-bold text-dark display-6">
                        Manage <span className="text-primary">Groups</span>
                    </h2>
                    <p className="text-muted mb-0">
                        View balances, invite friends, and settle shared
                        expenses in one click.
                    </p>
                </div>
                <div className="col-md-4 text-center text-md-end">
                    <button
                        className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm"
                        onClick={() => setShow(true)}
                    >
                        <i className="bi bi-plus-lg me-2"></i>
                        New Group
                    </button>
                </div>
            </div>

            <hr className="mb-5 opacity-10" />

            {groups.length === 0 && (
                <div className="text-center py-5 bg-light rounded-5 border border-dashed border-primary border-opacity-25 shadow-inner">
                    <div className="bg-white rounded-circle d-inline-flex p-4 mb-4 shadow-sm">
                        <i
                            className="bi bi-people text-primary"
                            style={{ fontSize: "3rem" }}
                        ></i>
                    </div>
                    <h4 className="fw-bold">No Groups Found</h4>
                    <p
                        className="text-muted mx-auto mb-4"
                        style={{ maxWidth: "400px" }}
                    >
                        You haven't joined any groups yet. Create a group to
                        start splitting bills with your friends or roommates!
                    </p>
                    <button
                        className="btn btn-outline-primary rounded-pill px-4"
                        onClick={() => setShow(true)}
                    >
                        Get Started
                    </button>
                </div>
            )}

            {groups.length > 0 && (
                <div className="row g-4 animate__animated animate__fadeIn">
                    {groups.map((group) => (
                        <div className="col-md-6 col-lg-4" key={group._id}>
                            <GroupCard
                                group={group}
                                onUpdate={handleGroupUpdateSuccess}
                            />
                        </div>
                    ))}
                </div>
            )}

            <CreateGroupModal
                show={show}
                onHide={() => setShow(false)}
                onSuccess={handleGroupUpdateSuccess}
            />
        </div>
    );
}

export default Groups;
