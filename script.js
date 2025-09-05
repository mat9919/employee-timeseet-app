// --- ส่วนที่ 1: ตั้งค่าการเชื่อมต่อกับ Supabase ---
const SUPABASE_URL = 'https://fipsalpfzrqnashdimqi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpcHNhbHBmenJxbmFzaGRpbXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwODQ0MjQsImV4cCI6MjA3MjY2MDQyNH0.lhs3PlCdz5kmO8xm7F_w93eT-0v2Sp-BZRxbLyAWCDc';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- ส่วนที่ 2: ฟังก์ชันสำหรับบันทึกข้อมูล ---
async function saveSchedule(event) {
    event.preventDefault();

    const employeeId = document.getElementById('employee-id').value;
    const employeeName = document.getElementById('employee-name').value;
    const date = document.getElementById('date').value;
    const status = document.getElementById('status').value;

    if (!employeeId || !employeeName || !date || !status) {
        alert('กรุณากรอกข้อมูลให้ครบทุกช่อง');
        return;
    }

    const scheduleData = {
        employee_id: employeeId,
        employee_name: employeeName,
        date: date,
        status: status
    };

    const { data, error } = await supabase.from('schedules').insert([scheduleData]);

    if (error) {
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message);
    } else {
        alert('บันทึกข้อมูลสำเร็จ!');
        document.getElementById('schedule-form').reset();
        loadSchedules();
    }
}

// --- ส่วนที่ 3: ฟังก์ชันสำหรับโหลดและแสดงข้อมูล ---
async function loadSchedules() {
    const tableBody = document.getElementById('schedule-table-body');
    tableBody.innerHTML = '<tr><td colspan="4">กำลังโหลด...</td></tr>';

    const { data, error } = await supabase.from('schedules').select('*').order('date', { ascending: false });

    if (error) {
        tableBody.innerHTML = '<tr><td colspan="4">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
    } else if (data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">ยังไม่มีข้อมูล</td></tr>';
    } else {
        tableBody.innerHTML = '';
        data.forEach(item => {
            const row = `<tr>
                <td>${item.employee_name} (${item.employee_id})</td>
                <td>${item.date}</td>
                <td>${item.status}</td>
                <td><button onclick="deleteSchedule(${item.id})">ลบ</button></td>
            </tr>`;
            tableBody.innerHTML += row;
        });
    }
}

// --- ส่วนที่ 4: ฟังก์ชันสำหรับลบข้อมูล ---
async function deleteSchedule(id) {
    if (!confirm('คุณต้องการลบข้อมูลนี้ใช่หรือไม่?')) return;

    const { data, error } = await supabase.from('schedules').delete().match({ id: id });

    if (error) {
        alert('เกิดข้อผิดพลาดในการลบข้อมูล: ' + error.message);
    } else {
        alert('ลบข้อมูลสำเร็จ!');
        loadSchedules();
    }
}

// --- ส่วนที่ 5: เริ่มต้นทำงาน ---
document.getElementById('schedule-form').addEventListener('submit', saveSchedule);
document.addEventListener('DOMContentLoaded', loadSchedules);
