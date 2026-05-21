import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { useNavigate } from "react-router-dom";

export default function CalendarView() {
  const [rooms, setRooms] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) { navigate("/"); return; }
    const q = query(collection(db, "rooms"), where("landlordId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setRooms(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [navigate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getDueRooms = (day) => {
    return rooms.filter((r) => {
      if (!r.dueDate) return false;
      const due = new Date(r.dueDate);
      return due.getFullYear() === year && due.getMonth() === month && due.getDate() === day;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Paid": return "bg-green-500";
      case "Pending": return "bg-yellow-500";
      case "Overdue": return "bg-red-500";
      case "Partial/Bal": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const today = new Date();
  const isToday = (day) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-24">
      {/* Header */}
      <div className="bg-gray-900 px-6 py-4 flex items-center justify-between shadow">
        <button onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-white transition">
          ← Back
        </button>
        <h1 className="text-lg font-bold">Due Date Calendar</h1>
        <div className="w-16" />
      </div>

      <div className="px-6 py-6">
        {/* Month Navigation */}
        <div className="flex justify-between items-center mb-4">
          <button onClick={prevMonth} className="text-gray-400 hover:text-white px-3 py-1 rounded-lg bg-gray-800 transition">
            ‹
          </button>
          <h2 className="text-lg font-semibold">{monthName}</h2>
          <button onClick={nextMonth} className="text-gray-400 hover:text-white px-3 py-1 rounded-lg bg-gray-800 transition">
            ›
          </button>
        </div>

        {/* Day Labels */}
        <div className="grid grid-cols-7 text-center text-xs text-gray-500 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const dueRooms = day ? getDueRooms(day) : [];
            return (
              <div
                key={idx}
                className={`min-h-[52px] rounded-lg p-1 text-xs flex flex-col items-center
                  ${day ? "bg-gray-900" : ""}
                  ${isToday(day) ? "ring-2 ring-blue-500" : ""}`}
              >
                {day && (
                  <>
                    <span className={`font-semibold mb-1 ${isToday(day) ? "text-blue-400" : "text-gray-300"}`}>
                      {day}
                    </span>
                    {dueRooms.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => navigate(`/property/${r.id}`)}
                        className={`w-full text-center rounded px-1 py-0.5 text-white text-[10px] truncate cursor-pointer mb-0.5 ${getStatusColor(r.status)}`}
                        title={r.roomName}
                      >
                        {r.roomName}
                      </div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6">
          <p className="text-gray-400 text-sm mb-2 font-medium">Legend</p>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Paid", color: "bg-green-500" },
              { label: "Pending", color: "bg-yellow-500" },
              { label: "Overdue", color: "bg-red-500" },
              { label: "Partial/Bal", color: "bg-orange-500" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${l.color}`} />
                <span className="text-gray-400 text-xs">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Dues */}
        <div className="mt-6">
          <p className="text-gray-400 text-sm mb-2 font-medium">All Due Dates This Month</p>
          {rooms.filter((r) => {
            if (!r.dueDate) return false;
            const due = new Date(r.dueDate);
            return due.getFullYear() === year && due.getMonth() === month;
          }).length === 0 ? (
            <p className="text-gray-600 text-sm">No dues this month.</p>
          ) : (
            <div className="space-y-2">
              {rooms
                .filter((r) => {
                  if (!r.dueDate) return false;
                  const due = new Date(r.dueDate);
                  return due.getFullYear() === year && due.getMonth() === month;
                })
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                .map((r) => (
                  <div
                    key={r.id}
                    onClick={() => navigate(`/property/${r.id}`)}
                    className="bg-gray-900 rounded-lg px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-800 transition"
                  >
                    <div>
                      <p className="font-medium text-sm">{r.roomName}</p>
                      <p className="text-gray-500 text-xs">{r.tenantName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400 text-xs">{new Date(r.dueDate).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        r.status === "Paid" ? "text-green-400 border-green-500 bg-green-500/10" :
                        r.status === "Overdue" ? "text-red-400 border-red-500 bg-red-500/10" :
                        r.status === "Partial/Bal" ? "text-orange-400 border-orange-500 bg-orange-500/10" :
                        "text-yellow-400 border-yellow-500 bg-yellow-500/10"
                      }`}>{r.status}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}