const ADMIN_PASSWORD = "snp@123";
let selectedEmployeeId = "";

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast bg-${type === "error" ? "red" : "green"}-500`;
  toast.innerText = message;
  document.getElementById("toastContainer").appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function formatDate(date) {
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, "0")}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${d.getFullYear().toString().slice(-2)}`;
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function isEventRecordedToday(employeeId, eventType) {
  const today = getTodayDate();
  const data = JSON.parse(localStorage.getItem("attendanceData")) || [];
  return data.some(
    (r) =>
      r.employee_id === employeeId &&
      r.event_type === eventType &&
      r.timestamp.startsWith(today)
  );
}

function updateButtonStates() {
  if (!selectedEmployeeId) return;
  const buttons = {
    day_start: startButton,
    day_end: endButton,
    lunch_start: lunchStartButton,
    lunch_end: lunchEndButton,
  };
  for (let [type, btn] of Object.entries(buttons)) {
    btn.disabled = isEventRecordedToday(selectedEmployeeId, type);
    btn.classList.toggle("disabled-button", btn.disabled);
  }
  endButton.disabled = !isEventRecordedToday(selectedEmployeeId, "day_start");
  lunchEndButton.disabled = !isEventRecordedToday(
    selectedEmployeeId,
    "lunch_start"
  );
}

function loadCurrentStatus() {
  const data = JSON.parse(localStorage.getItem("attendanceData")) || [];
  const table = document.getElementById("attendanceTableBody");
  table.innerHTML = "";
  const today = new Date().toISOString().split("T")[0];
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const filtered = data
    .filter(
      (r) =>
        r.employee_id === selectedEmployeeId &&
        r.timestamp >= threeMonthsAgo.toISOString() &&
        r.timestamp <= today + "T23:59:59"
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (filtered.length === 0) {
    table.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-400">No records found.</td></tr>`;
    return;
  }

  filtered.forEach((r) => {
    const d = new Date(r.timestamp);
    const tr = document.createElement("tr");
    tr.innerHTML = `
          <td>${formatDate(d)}</td>
          <td>${r.event_type.replace("_", " ").toUpperCase()}</td>
          <td>${d.toLocaleTimeString()}</td>
          <td>${r.reason || "-"}</td>
        `;
    table.appendChild(tr);
  });
}

function recordAttendance(type) {
  if (!selectedEmployeeId) return showToast("Select an employee!", "error");

  const preReqs = {
    day_end: "day_start",
    lunch_end: "lunch_start",
  };

  if (
    preReqs[type] &&
    !isEventRecordedToday(selectedEmployeeId, preReqs[type])
  ) {
    return showToast(
      `You must record "${preReqs[type].replace("_", " ")}" first.`,
      "error"
    );
  }

  if (isEventRecordedToday(selectedEmployeeId, type)) {
    return showToast(
      `Already recorded ${type.replace("_", " ")} today.`,
      "error"
    );
  }

  const record = {
    employee_id: selectedEmployeeId,
    event_type: type,
    timestamp: new Date().toISOString(),
  };

  const data = JSON.parse(localStorage.getItem("attendanceData")) || [];
  data.push(record);
  localStorage.setItem("attendanceData", JSON.stringify(data));

  showToast(`${type.replace("_", " ")} recorded`);
  loadCurrentStatus();
  updateButtonStates();
}

employeeDropdown.addEventListener("change", () => {
  selectedEmployeeId = employeeDropdown.value;
  loadCurrentStatus();
  updateButtonStates();
});

leaveButton.addEventListener("click", () => {
  if (!selectedEmployeeId) return showToast("Select an employee!", "error");
  const date = prompt("Enter leave date (YYYY-MM-DD):");
  const reason = prompt("Enter reason:");
  if (!date || !reason) return showToast("Date and reason required.", "error");

  const data = JSON.parse(localStorage.getItem("attendanceData")) || [];
  const exists = data.some(
    (r) =>
      r.employee_id === selectedEmployeeId &&
      r.event_type === "leave" &&
      r.timestamp.startsWith(date)
  );
  if (exists) return showToast("Leave already recorded.", "error");

  data.push({
    employee_id: selectedEmployeeId,
    event_type: "leave",
    timestamp: date + "T00:00:00Z",
    reason,
  });

  localStorage.setItem("attendanceData", JSON.stringify(data));
  showToast("Leave recorded");
  loadCurrentStatus();
});

clearDataButton.addEventListener("click", () => {
  passwordModal.classList.remove("hidden");
});

cancelPassword.addEventListener("click", () => {
  passwordModal.classList.add("hidden");
  adminPassword.value = "";
});

confirmClear.addEventListener("click", () => {
  if (adminPassword.value === ADMIN_PASSWORD) {
    localStorage.removeItem("attendanceData");
    showToast("All data cleared");
    loadCurrentStatus();
    updateButtonStates();
    passwordModal.classList.add("hidden");
    adminPassword.value = "";
  } else {
    showToast("Wrong password", "error");
  }
});

startButton.addEventListener("click", () => recordAttendance("day_start"));
endButton.addEventListener("click", () => recordAttendance("day_end"));
lunchStartButton.addEventListener("click", () =>
  recordAttendance("lunch_start")
);
lunchEndButton.addEventListener("click", () => recordAttendance("lunch_end"));

loadCurrentStatus();
