import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { serverEndpoint } from "../config/appConfig";

function GroupExpenses() {
    const { groupId } = useParams();
    const [group, setGroup] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchGroupData = async () => {
        setLoading(true);
        setError("");
        try {
            const [groupResponse, transactionsResponse] = await Promise.all([
                axios.get(`${serverEndpoint}/groups/${groupId}/details`, {
                    withCredentials: true,
                }),
                axios.get(
                    `${serverEndpoint}/groups/${groupId}/transactions`,
                    { withCredentials: true }
                ),
            ]);
            setGroup(groupResponse.data);
            setTransactions(transactionsResponse.data);
        } catch (err) {
            setError("Unable to load group details right now.");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(value || 0);
    };

    const formatDate = (value) => {
        return new Date(value).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    useEffect(() => {
        fetchGroupData();
    }, [groupId]);

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
                <p className="mt-3 text-muted fw-medium">Loading group...</p>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <nav aria-label="breadcrumb">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                        <Link to="/dashboard">Groups</Link>
                    </li>
                    <li className="breadcrumb-item active">Group Expenses</li>
                </ol>
            </nav>

            {error && (
                <div className="alert alert-danger border-0 shadow-sm rounded-4">
                    {error}
                </div>
            )}

            {group && (
                <div className="row g-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm rounded-4">
                            <div className="card-body p-4 p-md-5">
                                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
                                    <div>
                                        <p className="text-muted text-uppercase small fw-bold mb-1">
                                            Group Name
                                        </p>
                                        <h2 className="fw-bold mb-0">
                                            {group.name}
                                        </h2>
                                    </div>
                                    <span className="badge rounded-pill bg-primary-subtle text-primary px-3 py-2">
                                        {group.membersEmail.length} Members
                                    </span>
                                </div>

                                <h6 className="fw-bold mb-3">Members</h6>
                                <div className="row g-2">
                                    {group.membersEmail.map((member) => (
                                        <div
                                            className="col-md-6 col-lg-4"
                                            key={member}
                                        >
                                            <div className="bg-light border rounded-3 px-3 py-2 small text-truncate">
                                                {member}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12">
                        <div className="card border-0 shadow-sm rounded-4">
                            <div className="card-body p-4 p-md-5">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="fw-bold mb-0">
                                        Past Transactions
                                    </h5>
                                    <span className="badge rounded-pill bg-light text-dark">
                                        {transactions.length}
                                    </span>
                                </div>

                                {transactions.length === 0 && (
                                    <div className="alert alert-light border rounded-3 mb-0">
                                        No transactions yet for this group.
                                    </div>
                                )}

                                {transactions.length > 0 && (
                                    <div className="list-group list-group-flush">
                                        {transactions.map((transaction) => (
                                            <div
                                                key={transaction._id}
                                                className="list-group-item px-0 py-3"
                                            >
                                                <div className="d-flex justify-content-between align-items-start gap-3">
                                                    <div>
                                                        <h6 className="fw-semibold mb-1">
                                                            {transaction.title}
                                                        </h6>
                                                        <p className="text-muted small mb-1">
                                                            Paid by{" "}
                                                            {
                                                                transaction.paidByEmail
                                                            }
                                                        </p>
                                                        <p className="text-muted small mb-0">
                                                            {formatDate(
                                                                transaction.createdAt
                                                            )}
                                                        </p>
                                                    </div>
                                                    <span className="fw-bold text-primary">
                                                        {formatCurrency(
                                                            transaction.amount
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GroupExpenses;
