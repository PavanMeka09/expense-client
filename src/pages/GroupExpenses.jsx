import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { serverEndpoint } from "../config/appConfig";

function GroupExpenses() {
    const { groupId } = useParams();
    const [group, setGroup] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [summaryError, setSummaryError] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [settleMessage, setSettleMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [settling, setSettling] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        amount: "",
        splitType: "equal",
        splitWith: [],
        customSplits: {},
    });

    const fetchSummary = async () => {
        setSummaryError("");
        try {
            const response = await axios.get(
                `${serverEndpoint}/groups/${groupId}/summary`,
                { withCredentials: true }
            );
            setSummary(response.data);
        } catch (err) {
            setSummaryError("Unable to load expense summary.");
        }
    };

    const fetchGroupData = async () => {
        setLoading(true);
        setError("");
        setSummaryError("");
        setSummary(null);
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

        await fetchSummary();
    };

    const formatCurrency = (value, currency = summary?.currency || "INR") => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency,
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

    const roundToTwo = (value) =>
        Math.round((Number(value) + Number.EPSILON) * 100) / 100;

    useEffect(() => {
        fetchGroupData();
    }, [groupId]);

    useEffect(() => {
        if (!group) return;
        const members = group.membersEmail || [];
        setFormData((prev) => ({
            ...prev,
            splitWith: members,
            customSplits: members.reduce((acc, member) => {
                acc[member] = "";
                return acc;
            }, {}),
        }));
    }, [group]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSplitTypeChange = (event) => {
        const nextSplitType = event.target.value;
        setFormData((prev) => ({
            ...prev,
            splitType: nextSplitType,
        }));
    };

    const handleMemberToggle = (memberEmail) => {
        setFormData((prev) => {
            const exists = prev.splitWith.includes(memberEmail);
            if (exists && prev.splitWith.length === 1) {
                setSubmitError("At least one member must be included in split.");
                return prev;
            }
            const splitWith = exists
                ? prev.splitWith.filter((email) => email !== memberEmail)
                : [...prev.splitWith, memberEmail];
            return {
                ...prev,
                splitWith,
                customSplits: exists
                    ? Object.fromEntries(
                        Object.entries(prev.customSplits).filter(
                            ([email]) => email !== memberEmail
                        )
                    )
                    : { ...prev.customSplits, [memberEmail]: "" },
            };
        });
    };

    const handleCustomSplitChange = (memberEmail, value) => {
        setFormData((prev) => ({
            ...prev,
            customSplits: {
                ...prev.customSplits,
                [memberEmail]: value,
            },
        }));
    };

    const getCustomSplitTotal = () => {
        return roundToTwo(
            formData.splitWith.reduce(
                (sum, memberEmail) =>
                    sum + Number(formData.customSplits[memberEmail] || 0),
                0
            )
        );
    };

    const getCustomSplitDifference = () => {
        const total = getCustomSplitTotal();
        const amount = roundToTwo(Number(formData.amount) || 0);
        return roundToTwo(amount - total);
    };

    const handleCreateExpense = async (event) => {
        event.preventDefault();
        setSubmitError("");
        setSuccessMessage("");
        setSettleMessage("");

        const normalizedTitle = formData.title.trim();
        const normalizedAmount = Number(formData.amount);

        if (!normalizedTitle) {
            setSubmitError("Title is required.");
            return;
        }

        if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
            setSubmitError("Amount must be greater than 0.");
            return;
        }

        if (formData.splitWith.length === 0) {
            setSubmitError("Select at least one member to split with.");
            return;
        }

        if (formData.splitType === "custom") {
            const hasInvalidSplit = formData.splitWith.some(
                (memberEmail) => {
                    const value = Number(formData.customSplits[memberEmail]);
                    return !Number.isFinite(value) || value < 0;
                }
            );

            if (hasInvalidSplit) {
                setSubmitError("Split amount must be 0 or greater.");
                return;
            }

            const totalSplit = getCustomSplitTotal();
            if (totalSplit !== roundToTwo(normalizedAmount)) {
                setSubmitError(
                    "Custom split total must match expense amount."
                );
                return;
            }
        }

        setSubmitting(true);
        try {
            const payload = {
                title: normalizedTitle,
                amount: normalizedAmount,
                splitType: formData.splitType,
            };

            if (formData.splitType === "custom") {
                payload.splits = formData.splitWith.map((memberEmail) => ({
                    memberEmail,
                    amount: Number(formData.customSplits[memberEmail] || 0),
                }));
            } else {
                payload.splitWith = formData.splitWith;
            }

            const response = await axios.post(
                `${serverEndpoint}/groups/${groupId}/expenses`,
                payload,
                { withCredentials: true }
            );

            setTransactions((prev) => [response.data, ...prev]);
            setFormData((prev) => ({
                ...prev,
                title: "",
                amount: "",
                splitType: "equal",
                splitWith: group?.membersEmail || [],
                customSplits: (group?.membersEmail || []).reduce(
                    (acc, member) => {
                        acc[member] = "";
                        return acc;
                    },
                    {}
                ),
            }));
            setSuccessMessage("Expense added successfully.");
            await fetchSummary();
        } catch (err) {
            setSubmitError(
                err?.response?.data?.message || "Unable to create expense."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleSettleGroup = async () => {
        setSettleMessage("");
        setSummaryError("");
        setSubmitting(false);
        setSettling(true);

        try {
            await axios.post(
                `${serverEndpoint}/groups/${groupId}/settle`,
                {},
                { withCredentials: true }
            );
            setSettleMessage("Group settled successfully. Balances reset.");
            await fetchSummary();
        } catch (err) {
            setSummaryError(
                err?.response?.data?.message || "Unable to settle group."
            );
        } finally {
            setSettling(false);
        }
    };

    const customSplitTotal =
        formData.splitType === "custom" ? getCustomSplitTotal() : 0;
    const customSplitDifference =
        formData.splitType === "custom" ? getCustomSplitDifference() : 0;

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
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                                    <h5 className="fw-bold mb-0">
                                        Add New Expense
                                    </h5>
                                    <span className="badge rounded-pill bg-light text-dark">
                                        Split by {formData.splitType}
                                    </span>
                                </div>
                                <form
                                    className="row g-3"
                                    onSubmit={handleCreateExpense}
                                >
                                    <div className="col-md-6">
                                        <label className="form-label small fw-semibold">
                                            Title
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            placeholder="Dinner, Groceries, etc."
                                            required
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small fw-semibold">
                                            Amount
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="amount"
                                            min="0.01"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label small fw-semibold">
                                            Split Logic
                                        </label>
                                        <select
                                            className="form-select"
                                            value={formData.splitType}
                                            onChange={handleSplitTypeChange}
                                        >
                                            <option value="equal">Equal</option>
                                            <option value="custom">
                                                Custom
                                            </option>
                                        </select>
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label small fw-semibold d-block mb-2">
                                            Split With
                                        </label>
                                        <p className="text-muted small mb-2">
                                            Uncheck a member to exclude them
                                            from this expense.
                                        </p>
                                        <div className="d-flex flex-wrap gap-3">
                                            {group.membersEmail.map(
                                                (memberEmail) => (
                                                    <div
                                                        className="form-check"
                                                        key={memberEmail}
                                                    >
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id={`split-${memberEmail}`}
                                                            checked={formData.splitWith.includes(
                                                                memberEmail
                                                            )}
                                                            onChange={() =>
                                                                handleMemberToggle(
                                                                    memberEmail
                                                                )
                                                            }
                                                        />
                                                        <label
                                                            className="form-check-label small"
                                                            htmlFor={`split-${memberEmail}`}
                                                        >
                                                            {memberEmail}
                                                        </label>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {formData.splitType === "custom" &&
                                        formData.splitWith.length > 0 && (
                                            <div className="col-12">
                                                <div className="row g-3">
                                                    {formData.splitWith.map(
                                                        (memberEmail) => (
                                                            <div
                                                                className="col-md-4"
                                                                key={memberEmail}
                                                            >
                                                                <label className="form-label small fw-semibold">
                                                                    {
                                                                        memberEmail
                                                                    }
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    className="form-control"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={
                                                                        formData
                                                                            .customSplits[
                                                                            memberEmail
                                                                        ] || ""
                                                                    }
                                                                    onChange={(
                                                                        event
                                                                    ) =>
                                                                        handleCustomSplitChange(
                                                                            memberEmail,
                                                                            event
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    required
                                                                />
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center mt-3 small">
                                                    <span className="text-muted">
                                                        Total split
                                                    </span>
                                                    <span
                                                        className={`fw-semibold ${
                                                            customSplitDifference ===
                                                            0
                                                                ? "text-success"
                                                                : "text-danger"
                                                        }`}
                                                    >
                                                        {formatCurrency(
                                                            customSplitTotal
                                                        )}
                                                    </span>
                                                </div>
                                                {formData.amount && (
                                                    <p className="text-muted small mt-1 mb-0">
                                                        Difference:{" "}
                                                        {formatCurrency(
                                                            customSplitDifference
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                    {submitError && (
                                        <div className="col-12">
                                            <div className="alert alert-danger mb-0">
                                                {submitError}
                                            </div>
                                        </div>
                                    )}
                                    {successMessage && (
                                        <div className="col-12">
                                            <div className="alert alert-success mb-0">
                                                {successMessage}
                                            </div>
                                        </div>
                                    )}

                                    <div className="col-12">
                                        <button
                                            type="submit"
                                            className="btn btn-primary rounded-pill px-4"
                                            disabled={submitting}
                                        >
                                            {submitting
                                                ? "Adding..."
                                                : "Add Expense"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

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
                                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
                                    <div>
                                        <p className="text-muted text-uppercase small fw-bold mb-1">
                                            Expense Summary
                                        </p>
                                        <h5 className="fw-bold mb-1">
                                            Current Balances
                                        </h5>
                                        <p className="text-muted small mb-0">
                                            {summary
                                                ? `Total ${formatCurrency(
                                                    summary.totalExpenses
                                                )}`
                                                : "Total --"}
                                        </p>
                                    </div>
                                    <div className="text-start text-md-end">
                                        {summary?.lastSettled && (
                                            <p className="text-muted small mb-2">
                                                Last settled{" "}
                                                {formatDate(
                                                    summary.lastSettled
                                                )}
                                            </p>
                                        )}
                                        <button
                                            type="button"
                                            className="btn btn-outline-success rounded-pill px-4"
                                            onClick={handleSettleGroup}
                                            disabled={
                                                settling ||
                                                !summary ||
                                                summary.totalExpenses === 0
                                            }
                                        >
                                            {settling
                                                ? "Settling..."
                                                : "Settle Group"}
                                        </button>
                                    </div>
                                </div>

                                {summaryError && (
                                    <div className="alert alert-danger mb-3">
                                        {summaryError}
                                    </div>
                                )}

                                {settleMessage && (
                                    <div className="alert alert-success mb-3">
                                        {settleMessage}
                                    </div>
                                )}

                                {!summary && !summaryError && (
                                    <div className="alert alert-light border rounded-3 mb-0">
                                        Loading summary...
                                    </div>
                                )}

                                {summary && summary.totalExpenses === 0 && (
                                    <div className="alert alert-light border rounded-3 mb-3">
                                        No expenses to summarize yet.
                                    </div>
                                )}

                                {summary && summary.members.length > 0 && (
                                    <div className="table-responsive">
                                        <table className="table align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Member</th>
                                                    <th>Owes</th>
                                                    <th>Net Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {summary.members.map(
                                                    (member) => (
                                                        <tr
                                                            key={
                                                                member.memberEmail
                                                            }
                                                        >
                                                            <td className="small text-truncate">
                                                                {
                                                                    member.memberEmail
                                                                }
                                                            </td>
                                                            <td className="fw-semibold">
                                                                {formatCurrency(
                                                                    member.owes
                                                                )}
                                                            </td>
                                                            <td
                                                                className={`fw-bold ${
                                                                    member.netBalance >
                                                                    0
                                                                        ? "text-success"
                                                                        : member.netBalance <
                                                                            0
                                                                        ? "text-danger"
                                                                        : "text-muted"
                                                                }`}
                                                            >
                                                                {formatCurrency(
                                                                    member.netBalance
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
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
