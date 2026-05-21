import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

export default function Dashboard() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { navigate("/"); return; }

    const q = query(collection(db, "rooms"), where("landlordId", "==", user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRooms(data);
      setLoading(false);
    });

    return () => unsub();
  }, [navigate]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Paid": return "bg-green-500/20 text-green-400 border border-green-500";
      case "Pending": return "bg-yellow-500/20 text-yellow-400 border border-yellow-500";
      case "Overdue": return "bg-red-500/20 text-red-400 border border-red-500";
      case "Partial/Bal": return "bg-orange-500/20 text-orange-400 border border-orange-500";
      default: return "bg-gray-500/20 text-gray-400 border border-gray-500";
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const summary = {
    total: rooms.length,
    paid: rooms.filter((r) => r.status === "Paid").length,
    pending: rooms.filter((r) => r.status === "Pending").length,
    overdue: rooms.filter((r) => r.status === "Overdue").length,
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="bg-gray-900 px-6 py-4 flex justify-between items-center shadow">
        <h1 className="text-xl font-bold">
          Rent<span className="text-blue-500">Track</span>
        </h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-red-400 transition"
        >
          Logout
        </button>
      </div>

      <div className="px-6 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
          {[
            { label: "Total Rooms", value: summary.total, color: "text-white" },
            { label: "Paid", value: summary.paid, color: "text-green-400" },
            { label: "Pending", value: summary.pending, color: "text-yellow-400" },
            { label: "Overdue", value: summary.overdue, color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900 rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-gray-400 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Section Title */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Properties Overview</h2>
          <button
            onClick={() => navigate("/property/new")}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition"
          >
            + Add Room
          </button>
        </div>

        {/* Room Cards */}
        {loading ? (
          <p className="text-gray-500 text-sm">Loading rooms...</p>
        ) : rooms.length === 0 ? (
          <div className="text-center text-gray-600 mt-16">
            <p className="text-4xl mb-3">🏠</p>
            <p className="text-sm">No rooms yet. Add your first room!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => navigate(`/property/${room.id}`)}
                className="bg-gray-900 rounded-xl p-5 cursor-pointer hover:bg-gray-800 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{room.roomName}</h3>
                    <p className="text-gray-400 text-sm">{room.tenantName}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusStyle(room.status)}`}>
                    {room.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Rent</p>
                    <p className="text-white font-medium">₱{room.rentPrice?.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-xs">Balance</p>
                    <p className={`font-medium ${room.balance > 0 ? "text-red-400" : "text-green-400"}`}>
                      ₱{room.balance?.toLocaleString() ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}