// --- ส่วนที่ 1: การตั้งค่าและเชื่อมต่อ SUPABASE ---
const SUPABASE_URL = 'https://fipsalpfzrqnashdimqi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpcHNhbHBmenJxbmFzaGRpbXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwODQ0MjQsImV4cCI6MjA3MjY2MDQyNH0.lhs3PlCdz5kmO8xm7F_w93eT-0v2Sp-BZRxbLyAWCDc';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTS ---
    const DAILY_WAGE = 600;

    // --- DATA (State) ---
    let state = {
        isAdmin: false,
        currentDate: new Date(),
        employees: [], // ข้อมูลพนักงานจะถูกดึงมาจาก Supabase
        attendance: {} // ข้อมูลการลงเวลาจะถูกดึงมาจาก Supabase
    };

    // --- DOM ELEMENTS ---
    const dateDisplay = document.getElementById('dateDisplay');
    const tableHead = document.querySelector('#attendanceTable thead');
    const tableBody = document.getElementById('tableBody');
    const adminBtn = document.getElementById('adminBtn');
    const appContainer = document.getElementById('app-container');
    const addEmployeeBtn = document.getElementById('addEmployeeBtn');
    
    const employeeModal = document.getElementById('employeeModal');
    const employeeForm = document.getElementById('employeeForm');
    const modalTitle = document.getElementById('modalTitle');
    const cancelBtn = document.getElementById('cancelBtn');
    const employeeIdInput = document.getElementById('employeeIdInput'); // นี่คือ ID ที่ซ่อนไว้ (PK)
    const employeeNameInput = document.getElementById('employeeNameInput');
    const employeeCodeInput = document.getElementById('employeeCodeInput'); // นี่คือรหัสพนักงานที่แสดง

    const summaryModal = document.getElementById('summaryModal');
    const summaryModalTitle = document.getElementById('summaryModalTitle');
    const summaryContent = document.getElementById('summaryContent');
    const closeSummaryBtn = document.getElementById('closeSummaryBtn');

    // --- SUPABASE FUNCTIONS ---

    // โหลดข้อมูลพนักงานทั้งหมด
    async function loadEmployees() {
        const { data, error } = await supabase.from('employees').select('*').order('name');
        if (error) {
            console.error('Error loading employees:', error);
            alert('ไม่สามารถโหลดข้อมูลพนักงานได้');
            return;
        }
        state.employees = data;
    }

    // โหลดข้อมูลการลงเวลาของเดือนที่แสดง
    async function loadAttendanceForMonth() {
        const firstDay = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() -1, 16);
        const lastDay = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth(), 15);

        const { data, error } = await supabase.from('schedules')
            .select('*')
            .gte('date', firstDay.toISOString().split('T')[0])
            .lte('date', lastDay.toISOString().split('T')[0]);

        if (error) {
            console.error('Error loading attendance:', error);
            alert('ไม่สามารถโหลดข้อมูลการลงเวลาได้');
            return;
        }
        
        state.attendance = {};
        data.forEach(record => {
            if (!state.attendance[record.employee_id]) {
                state.attendance[record.employee_id] = {};
            }
            state.attendance[record.employee_id][record.date] = record.status;
        });
    }
    
    // บันทึก/อัปเดตสถานะการทำงาน
    async function saveAttendance(employeeId, dateString, status) {
        const { error } = await supabase.from('schedules').upsert({
            employee_id: employeeId,
            date: dateString,
            status: status
        }, { onConflict: 'employee_id, date' });

        if (error) {
            console.error('Error saving attendance:', error);
            alert('บันทึกข้อมูลการลงเวลาไม่สำเร็จ');
        }
    }

    // --- RENDER FUNCTIONS ---
    function getPayPeriodDates(date) {
        const dates = [];
        let startDate = new Date(date.getFullYear(), date.getMonth() - 1, 16);
        for (let i = 0; i < 31; i++) {
            dates.push(new Date(startDate));
            startDate.setDate(startDate.getDate() + 1);
            if (startDate.getDate() === 16) break; // Stop when it loops to the 16th of the next month
        }
        return dates;
    }

    function renderApp() {
        const dates = getPayPeriodDates(state.currentDate);
        let headerHtml = '<tr><th>พนักงาน</th>';
        dates.forEach(d => { headerHtml += `<th>${d.getDate()}</th>`; });
        headerHtml += '<th>สรุปผล</th></tr>';
        tableHead.innerHTML = headerHtml;

        let bodyHtml = '';
        state.employees.forEach(emp => {
            bodyHtml += `<tr data-id="${emp.id}">
                <td>
                    <div class="employee-info">
                        <div class="employee-details">
                            <div class="name">${emp.name}</div>
                            <div class="id">${emp.employee_code}</div>
                        </div>
                        <div class="employee-actions">
                            <button class="edit-btn"><i class="fas fa-pencil-alt"></i></button>
                            <button class="delete-btn"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                </td>`;
            
            const empAttendance = state.attendance[emp.id] || {};
            dates.forEach(d => {
                const dateString = d.toISOString().split('T')[0];
                const status = empAttendance[dateString] || 'F'; // Default to 'F' (ลา)
                bodyHtml += `<td><button class="status-btn status-${status.toLowerCase()}" data-date="${dateString}">${status}</button></td>`;
            });
            bodyHtml += `<td><button class="summary-btn">สรุปรายได้</button></td></tr>`;
        });
        tableBody.innerHTML = bodyHtml;

        dateDisplay.textContent = `16 ${state.currentDate.toLocaleDateString('th-TH', { month: 'short' })} - 15 ${new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() + 1, 0).toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })}`;
        appContainer.classList.toggle('admin-mode', state.isAdmin);
        adminBtn.style.color = state.isAdmin ? 'var(--accent-yellow)' : 'var(--secondary-text)';
    }

    // --- MODAL FUNCTIONS ---
    function showEmployeeModal(mode, empId = null) {
        employeeForm.reset();
        if (mode === 'add') {
            modalTitle.textContent = 'เพิ่มพนักงานใหม่';
            employeeIdInput.value = ''; // Clear hidden ID for add mode
        } else if (mode === 'edit') {
            modalTitle.textContent = 'แก้ไขข้อมูลพนักงาน';
            const emp = state.employees.find(e => e.id === empId);
            if (emp) {
                employeeIdInput.value = emp.id; // Set hidden ID for edit mode
                employeeNameInput.value = emp.name;
                employeeCodeInput.value = emp.employee_code;
            }
        }
        employeeModal.style.display = 'flex';
    }
    
    // (ฟังก์ชันอื่นๆ เช่น hideEmployeeModal, showSummaryModal, hideSummaryModal ยังคงเหมือนเดิม)
    function hideEmployeeModal() { employeeModal.style.display = 'none'; }
    function hideSummaryModal() { summaryModal.style.display = 'none'; }
    function showSummaryModal(empId) { /* โค้ดสรุปผลยังไม่เชื่อม Supabase ในเวอร์ชันนี้ */ alert('ฟังก์ชันสรุปผลกำลังอยู่ในระหว่างการพัฒนา'); }


    // --- EVENT LISTENERS ---
    adminBtn.addEventListener('click', () => {
        if (state.isAdmin) {
            state.isAdmin = false;
            renderApp();
        } else {
            const password = prompt('กรุณาใส่รหัสผ่าน Admin:');
            if (password === 'admin') { // ควรเปลี่ยนรหัสผ่านนี้
                state.isAdmin = true;
                renderApp();
            } else if (password) {
                alert('รหัสผ่านไม่ถูกต้อง!');
            }
        }
    });

    tableBody.addEventListener('click', async (e) => {
        const empRow = e.target.closest('tr');
        if (!empRow) return;
        const empId = parseInt(empRow.dataset.id); // ID จาก Supabase เป็นตัวเลข

        if (e.target.closest('.summary-btn')) {
            showSummaryModal(empId);
            return;
        }

        if (!state.isAdmin) return;

        const statusBtn = e.target.closest('.status-btn');
        const editBtn = e.target.closest('.edit-btn');
        const deleteBtn = e.target.closest('.delete-btn');

        if (statusBtn) {
            const date = statusBtn.dataset.date;
            const currentStatus = statusBtn.textContent;
            const newStatus = currentStatus === 'N' ? 'F' : 'N';
            
            // Update UI immediately for better UX
            statusBtn.textContent = newStatus;
            statusBtn.className = `status-btn status-${newStatus.toLowerCase()}`;
            if (!state.attendance[empId]) state.attendance[empId] = {};
            state.attendance[empId][date] = newStatus;

            // Save to Supabase in the background
            await saveAttendance(empId, date, newStatus);

        } else if (editBtn) {
            showEmployeeModal('edit', empId);
        } else if (deleteBtn) {
            const emp = state.employees.find(e => e.id === empId);
            if (confirm(`คุณต้องการลบพนักงาน "${emp.name}" ใช่หรือไม่?`)) {
                const { error } = await supabase.from('employees').delete().match({ id: empId });
                if (error) {
                    alert('ลบพนักงานไม่สำเร็จ: ' + error.message);
                } else {
                    alert('ลบพนักงานสำเร็จ');
                    await initializeApp(); // โหลดข้อมูลใหม่ทั้งหมด
                }
            }
        }
    });

    addEmployeeBtn.addEventListener('click', () => showEmployeeModal('add'));
    cancelBtn.addEventListener('click', hideEmployeeModal);
    closeSummaryBtn.addEventListener('click', hideSummaryModal);

    employeeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const hiddenId = parseInt(employeeIdInput.value);
        const name = employeeNameInput.value;
        const code = employeeCodeInput.value;

        let error;
        if (hiddenId) { // Edit mode
            const { error: updateError } = await supabase.from('employees')
                .update({ name: name, employee_code: code })
                .match({ id: hiddenId });
            error = updateError;
        } else { // Add mode
            const { error: insertError } = await supabase.from('employees')
                .insert([{ name: name, employee_code: code }]);
            error = insertError;
        }

        if (error) {
            alert('บันทึกข้อมูลพนักงานไม่สำเร็จ: ' + error.message);
        } else {
            hideEmployeeModal();
            await initializeApp(); // โหลดข้อมูลใหม่ทั้งหมด
        }
    });

    document.getElementById('prevMonthBtn').addEventListener('click', async () => {
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        await loadAttendanceForMonth();
        renderApp();
    });
    
    document.getElementById('nextMonthBtn').addEventListener('click', async () => {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        await loadAttendanceForMonth();
        renderApp();
    });

    // --- INITIALIZE APP ---
    async function initializeApp() {
        tableBody.innerHTML = '<tr><td colspan="33">กำลังโหลดข้อมูลจากเซิร์ฟเวอร์...</td></tr>';
        await loadEmployees();
        await loadAttendanceForMonth();
        renderApp();
    }

    initializeApp();
});
