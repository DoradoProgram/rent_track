import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  doc, getDoc, setDoc, addDoc, updateDoc,
  collection, onSnapshot, query, orderBy, serverTimestamp, deleteDoc
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

const STATUS_OPTIONS = ["Paid", "Pending", "Overdue", "Partial/Bal"];

export default function PropertyDetail() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const [form, setForm] = useState({
    roomName: "", tenantName: "", rentPrice: "", balance: 0,
    dateMovedIn: "", dueDate: "", status: "Pending",
  });
  const [payments, setPayments] = useState([]);
  const [payAmount, setPayAmount] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    const fetch = async () => {
      const snap = await getDoc(doc(db, "rooms", id));
      if (snap.exists()) setForm(snap.data());
      setLoading(false);
    };
    fetch();

    const q = query(collection(db, "rooms", id, "payments"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [id, isNew]);

  const handleSave = async () => {
    setSaving(true);
    const user = auth.currentUser;
    const data = {
      ...form,
      rentPrice: parseFloat(form.rentPrice) || 0,
      balance: parseFloat(form.balance) || 0,
      landlordId: user.uid,
    };
    if (isNew) {
      await addDoc(collection(db, "rooms"), data);
    } else {
      await updateDoc(doc(db, "rooms", id), data);
    }
    setSaving(false);
    navigate("/dashboard");
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this room?")) return;
    await deleteDoc(doc(db, "rooms", id));
    navigate("/dashboard");
  };

  const handleAddPayment = async () => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return;
    await addDoc(collection(db, "rooms", id, "payments"), {
      amount,
      date: serverTimestamp(),
    });
    const newBalance = Math.max(0, (parseFloat(form.balance) || 0) - amount);
    const newStatus = newBalance === 0 ? "Paid" : "Partial/Bal";
    await updateDoc(doc(db, "rooms", id), { balance: newBalance, status: newStatus });
    setForm((prev) => ({ ...prev, balance: newBalance, status: newStatus }));
    setPayAmount("");
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Paid": return "bg-green-500/20 text-green-400 border-green-500";
      case "Pending": return "bg-yellow-500/20 text-yellow-400 border-yellow-500";
      case "Overdue": return "bg-red-500/20 text-red-400 border-red-500";
      case "Partial/Bal": return "bg-orange-500/20 text-orange-400 border-orange-500";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500";
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="bg-gray-900 px-6 py-4 flex items-center gap-4 shadow">
        <button onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-white transition">
          ← Back
        </button>
        <h1 className="text-lg font-bold">{isNew ? "Add New Room" : "Room Details"}</h1>
      </div>

      <div className="px-6 py-6 space-y-4">
        {/* Form Fields */}
        {[
          { label: "Room Name", key: "roomName", type: "text", placeholder: "e.g. Room 1" },
          { label: "Tenant Name", key: "tenantName", type: "text", placeholder: "e.g. Juan Dela Cruz" },
          { label: "Rent Price (₱)", key: "rentPrice", type: "number", placeholder: "e.g. 3500" },
          { label: "Balance (₱)", key: "balance", type: "number", placeholder: "e.g. 0" },
          { label: "Date Moved In", key: "dateMovedIn", type: "date", placeholder: "" },
          { label: "Due Date", key: "dueDate", type: "date", placeholder: "" },
        ].map(({ label, key, type, placeholder }) => (
          <div key={key}>
            <label className="block text-gray-400 text-sm mb-1">{label}</label>
            <input
              type={type}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600"
            />
          </div>
        ))}

        {/* Status */}
        <div>
          <label className="block text-gray-400 text-sm mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
        >
          {saving ? "Saving..." : isNew ? "Add Room" : "Save Changes"}
        </button>

        {/* Delete Button */}
        {!isNew && (
          <button
            onClick={handleDelete}
            className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600 font-semibold py-3 rounded-lg transition"
          >
            Delete Room
          </button>
        )}

        {/* Payment History */}
        {!isNew && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Payment History</h2>

            {/* Add Payment */}
            <div className="flex gap-2 mb-4">
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="Enter amount paid"
                className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-600"
              />
              <button
                onClick={handleAddPayment}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-sm font-semibold transition"
              >
                Log
              </button>
            </div>

            {/* Payment List */}
            {payments.length === 0 ? (
              <p className="text-gray-600 text-sm">No payments logged yet.</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="bg-gray-900 rounded-lg px-4 py-3 flex justify-between items-center">
                    <span className="text-green-400 font-semibold">₱{p.amount?.toLocaleString()}</span>
                    <span className="text-gray-500 text-xs">
                      {p.date?.toDate
                        ? p.date.toDate().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
                        : "Just now"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}