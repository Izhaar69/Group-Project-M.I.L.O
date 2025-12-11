class HRSystem {
    constructor() {
        this.currentEmployeeId = 11;
        this.init();
    }
    
    init() {
        this.checkLogin();
        this.setupEvents();
        this.loadDropdowns();
    }
    
    checkLogin() {
        if (sessionStorage.getItem('hrLoggedIn') === 'true') {
            this.showMain();
        } else {
            this.showLogin();
        }
    }
    
    showLogin() {
        const modal = new bootstrap.Modal(document.getElementById('loginModal'));
        modal.show();
    }
    
    showMain() {
        document.getElementById('mainContent').style.display = 'block';
        document.querySelector('.modal-backdrop')?.remove();
        this.loadDashboard();
    }
    
    setupEvents() {
        // Login form
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            if (user === 'admin' && pass === 'admin123') {
                sessionStorage.setItem('hrLoggedIn', 'true');
                this.showMain();
            } else {
                document.getElementById('loginError').classList.remove('d-none');
            }
        });
        
        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            sessionStorage.removeItem('hrLoggedIn');
            location.reload();
        });
        
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.getAttribute('href')?.substring(1);
                if (target) this.showSection(target);
            });
        });
    }
    
    showSection(sectionId) {
        ['dashboard', 'employees', 'payroll', 'attendance'].forEach(id => {
            document.getElementById(id).style.display = 'none';
        });
        document.getElementById(sectionId).style.display = 'block';
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) link.classList.add('active');
        });
        
        switch(sectionId) {
            case 'dashboard': this.loadDashboard(); break;
            case 'employees': this.loadEmployees(); break;
            case 'payroll': this.loadPayroll(); break;
            case 'attendance': this.loadAttendance(); break;
        }
    }
    
    loadDropdowns() {
        const empSelect = document.getElementById('employeeSelect');
        const leaveSelect = document.getElementById('leaveEmployee');
        if (empSelect) empSelect.innerHTML = '<option value="">Select Employee</option>';
        if (leaveSelect) leaveSelect.innerHTML = '<option value="">Select Employee</option>';
        
        window.employees.forEach(emp => {
            if (empSelect) {
                const opt = document.createElement('option');
                opt.value = emp.employeeId;
                opt.textContent = emp.name;
                empSelect.appendChild(opt);
            }
            if (leaveSelect) {
                const opt = document.createElement('option');
                opt.value = emp.employeeId;
                opt.textContent = emp.name;
                leaveSelect.appendChild(opt);
            }
        });
    }
    
    loadDashboard() {
        // Update stats
        document.getElementById('totalEmployees').textContent = window.employees.length;
        
        let totalPresent = 0;
        let totalDays = 0;
        window.attendance.forEach(emp => {
            emp.attendance.forEach(day => {
                totalDays++;
                if (day.status === 'Present') totalPresent++;
            });
        });
        const attendanceRate = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;
        document.getElementById('avgAttendance').textContent = `${attendanceRate}%`;
        
        let pendingCount = 0;
        window.attendance.forEach(emp => {
            emp.leaveRequests?.forEach(req => {
                if (req.status === 'Pending') pendingCount++;
            });
        });
        document.getElementById('pendingRequests').textContent = pendingCount;
        
        const totalPayroll = window.payroll.reduce((sum, p) => sum + p.finalSalary, 0);
        document.getElementById('monthlyPayroll').textContent = `R${totalPayroll.toLocaleString()}`;
        
        // Department chart
        const deptCount = {};
        window.employees.forEach(emp => {
            deptCount[emp.department] = (deptCount[emp.department] || 0) + 1;
        });
        
        const chartDiv = document.getElementById('departmentChart');
        chartDiv.innerHTML = '';
        Object.entries(deptCount).forEach(([dept, count]) => {
            const width = (count / window.employees.length) * 100;
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.width = `${width}%`;
            bar.textContent = `${dept}: ${count} employees`;
            chartDiv.appendChild(bar);
        });
    }
    
    loadEmployees() {
        const table = document.getElementById('employeesTable');
        table.innerHTML = '';
        
        window.employees.forEach(emp => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${emp.name}</strong></td>
                <td><span class="badge bg-info">${emp.department}</span></td>
                <td>${emp.position}</td>
                <td>R${emp.salary.toLocaleString()}</td>
                <td><small>${emp.contact}</small></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="hrSystem.viewEmployee(${emp.employeeId})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="hrSystem.deleteEmployee(${emp.employeeId})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            table.appendChild(row);
        });
    }
    
    viewEmployee(id) {
        const emp = window.employees.find(e => e.employeeId === id);
        const pay = window.payroll.find(p => p.employeeId === id);
        const att = window.attendance.find(a => a.employeeId === id);
        
        if (!emp) return;
        
        let details = `<strong>${emp.name}</strong><br>`;
        details += `Position: ${emp.position}<br>`;
        details += `Department: ${emp.department}<br>`;
        details += `Salary: R${emp.salary.toLocaleString()}<br>`;
        details += `Contact: ${emp.contact}<br>`;
        details += `Phone: ${emp.phone || 'N/A'}<br>`;
        details += `History: ${emp.employmentHistory}<br>`;
        
        if (pay) {
            details += `<br><strong>Payroll Info:</strong><br>`;
            details += `Hours Worked: ${pay.hoursWorked}<br>`;
            details += `Leave Deductions: ${pay.leaveDeductions} hours<br>`;
            details += `Final Salary: R${pay.finalSalary.toLocaleString()}`;
        }
        
        if (att) {
            const presentDays = att.attendance.filter(d => d.status === 'Present').length;
            const rate = Math.round((presentDays / att.attendance.length) * 100);
            details += `<br><br><strong>Attendance:</strong> ${rate}% (${presentDays}/${att.attendance.length} days)`;
        }
        
        alert(details);
    }
    
    deleteEmployee(id) {
        if (confirm('Delete this employee?')) {
            window.employees = window.employees.filter(e => e.employeeId !== id);
            window.payroll = window.payroll.filter(p => p.employeeId !== id);
            window.attendance = window.attendance.filter(a => a.employeeId !== id);
            this.loadEmployees();
            this.loadDashboard();
            this.loadDropdowns();
            alert('Employee deleted!');
        }
    }
    
    loadPayroll() {
        const table = document.getElementById('payrollTable');
        table.innerHTML = '';
        
        window.payroll.forEach(p => {
            const emp = window.employees.find(e => e.employeeId === p.employeeId);
            if (!emp) return;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${emp.name}</td>
                <td>${p.hoursWorked}</td>
                <td>${p.leaveDeductions}</td>
                <td>R${p.finalSalary.toLocaleString()}</td>
            `;
            table.appendChild(row);
        });
        
        this.updatePayslip();
    }
    
    updatePayslip() {
        const empId = document.getElementById('employeeSelect').value;
        const month = document.getElementById('payrollMonth').value;
        const preview = document.getElementById('payslipPreview');
        const printBtn = document.getElementById('printBtn');
        
        if (!empId || !month) {
            preview.style.display = 'none';
            printBtn.disabled = true;
            return;
        }
        
        const emp = window.employees.find(e => e.employeeId == empId);
        const pay = window.payroll.find(p => p.employeeId == empId);
        
        if (!emp || !pay) return;
        
        const basic = emp.salary / 12;
        const deductions = pay.leaveDeductions * 50;
        const tax = basic * 0.15;
        const net = basic - deductions - tax;
        
        document.getElementById('previewName').textContent = emp.name;
        document.getElementById('previewPeriod').textContent = month;
        document.getElementById('previewBasic').textContent = basic.toFixed(2);
        document.getElementById('previewDeductions').textContent = deductions.toFixed(2);
        document.getElementById('previewTax').textContent = tax.toFixed(2);
        document.getElementById('previewNet').textContent = net.toFixed(2);
        
        preview.style.display = 'block';
        printBtn.disabled = false;
    }
    
    printPayslip() {
        const printWindow = window.open('', '_blank');
        const content = `
            <html><head><title>Payslip</title><style>
                body { font-family: Arial; padding: 20px; }
                .payslip { border: 2px solid #000; padding: 20px; }
                h2 { text-align: center; color: #2c3e50; }
                .total { background: #f0f0f0; padding: 10px; font-weight: bold; }
            </style></head><body>
            <div class="payslip">
                <h2>MODERNTECH SOLUTIONS</h2>
                <h3>PAYSLIP</h3>
                <hr>
                <p><strong>Employee:</strong> ${document.getElementById('previewName').textContent}</p>
                <p><strong>Period:</strong> ${document.getElementById('previewPeriod').textContent}</p>
                <hr>
                <p>Basic Salary: R${document.getElementById('previewBasic').textContent}</p>
                <p>Leave Deductions: -R${document.getElementById('previewDeductions').textContent}</p>
                <p>Tax: -R${document.getElementById('previewTax').textContent}</p>
                <hr>
                <div class="total">
                    NET PAY: R${document.getElementById('previewNet').textContent}
                </div>
            </div>
            </body></html>

            

        `;
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
    }
    
   downloadPayslip() {
    const preview = document.getElementById("payslipPreview");
    
    if (!preview || preview.style.display === 'none') {
        alert("No payslip available to download!");
        return;
    }

    const content = preview.innerHTML;
    const win = window.open("", "_blank", "width=800,height=600");

    win.document.write(`
        <html>
        <head>
            <title>Payslip</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .payslip-box { border: 2px solid #333; padding: 20px; border-radius: 10px; width: 80%; margin: 0 auto; }
                .total { margin-top: 20px; padding: 10px; background: #f8f9fa; font-weight: bold; border-left: 4px solid #28a745; }
            </style>
        </head>
        <body>
            <div class="payslip-box">
                ${content}
            </div>
        </body>
        </html>
    `);

    win.document.close();
    win.print();


}

    loadAttendance() {
        const table = document.getElementById('attendanceTable');
        const requestsDiv = document.getElementById('leaveRequests');
        
        table.innerHTML = '';
        requestsDiv.innerHTML = '';
        
        let hasPending = false;
        
        window.attendance.forEach(emp => {
            const present = emp.attendance.filter(d => d.status === 'Present').length;
            const rate = Math.round((present / emp.attendance.length) * 100);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${emp.name}</td>
                <td>${present}</td>
                <td>${emp.attendance.length - present}</td>
                <td><span class="status-${rate >= 80 ? 'present' : 'absent'}">${rate}
            `;
            table.appendChild(row);
            
            // Leave requests
            emp.leaveRequests?.forEach(req => {
                if (req.status === 'Pending') {
                    hasPending = true;
                    const reqDiv = document.createElement('div');
                    reqDiv.className = 'alert alert-warning d-flex justify-content-between align-items-center mb-2';
                    reqDiv.innerHTML = `
                        <div>
                            <strong>${emp.name}</strong><br>
                            <small>${req.date} - ${req.reason}</small>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-success me-1" onclick="hrSystem.approveRequest(${emp.employeeId}, '${req.date}')">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="hrSystem.rejectRequest(${emp.employeeId}, '${req.date}')">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        
                    `;
                    requestsDiv.appendChild(reqDiv);
                }
            });
        });
        
        if (!hasPending) {
            requestsDiv.innerHTML = '<p class="text-muted mb-0">No pending leave requests</p>';
        }
    }
    
    approveRequest(empId, date) {
        const emp = window.attendance.find(e => e.employeeId === empId);
        if (emp) {
            const req = emp.leaveRequests.find(r => r.date === date);
            if (req) req.status = 'Approved';
            this.loadAttendance();
            this.loadDashboard();
            alert('Leave request approved!');
        }
    }
    
    rejectRequest(empId, date) {
        const emp = window.attendance.find(e => e.employeeId === empId);
        if (emp) {
            const req = emp.leaveRequests.find(r => r.date === date);
            if (req) req.status = 'Denied';
            this.loadAttendance();
            alert('Leave request rejected!');
        }
    }
    
    showAddForm() {
        document.getElementById('addForm').style.display = 'block';
    }
    
    hideAddForm() {
        document.getElementById('addForm').style.display = 'none';
        document.getElementById('employeeForm').reset();
    }
    
    addEmployee(e) {
        e.preventDefault();
        const form = e.target;
        const newEmp = {
            employeeId: this.currentEmployeeId++,
            name: form[0].value,
            contact: form[1].value,
            department: form[2].value,
            position: form[3].value,
            salary: parseInt(form[4].value),
            phone: form[5].value,
            status: 'Active',
            employmentHistory: 'New employee'
        };
        
        window.employees.push(newEmp);
        window.payroll.push({
            employeeId: newEmp.employeeId,
            hoursWorked: 160,
            leaveDeductions: 0,
            finalSalary: newEmp.salary
        });
        
        window.attendance.push({
            employeeId: newEmp.employeeId,
            name: newEmp.name,
            attendance: [
                {date: new Date().toISOString().split('T')[0], status: 'Present'}
            ],
            leaveRequests: []
        });
        
        this.hideAddForm();
        this.loadEmployees();
        this.loadDashboard();
        this.loadDropdowns();
        alert('Employee added successfully!');
    }
    
    submitLeave(e) {
        e.preventDefault();
        const form = e.target;
        const empId = document.getElementById('leaveEmployee').value;
        const emp = window.employees.find(e => e.employeeId == empId);
        
        if (!emp) {
            alert('Please select an employee');
            return;
        }
        
        const att = window.attendance.find(a => a.employeeId == empId);
        if (att) {
            att.leaveRequests.push({
                date: form[2].value,
                reason: `${form[1].value}: ${form[4].value}`,
                status: 'Pending'
            });
        }
        
        form.reset();
        this.loadAttendance();
        alert('Leave request submitted!');
    }
}

// Global functions
let hrSystem;
window.onload = () => { hrSystem = new HRSystem(); };

function showSection(id) { hrSystem.showSection(id); }
function showAddForm() { hrSystem.showAddForm(); }
function hideAddForm() { hrSystem.hideAddForm(); }
function addEmployee(e) { hrSystem.addEmployee(e); }
function updatePayslip() { hrSystem.updatePayslip(); }
function printPayslip() { hrSystem.printPayslip(); }
function submitLeave(e) { hrSystem.submitLeave(e); }



const ctx = document.getElementById("departmentChart");

const departmentNames = [
    "Development",
    "HR",
    "QA",
    "Sales",
    "Marketing",
    "Design",
    "IT",
    "Finance",
    "Support"
];

const departmentCounts = [1, 1, 1, 1, 2, 1, 1, 1, 1];

new Chart(ctx, {
    type: "pie",
    data: {
        labels: departmentNames,
        datasets: [{
            data: departmentCounts,
            backgroundColor: [
                "#007bff",
                "#28a745",
                "#ffc107",
                "#dc3545",
                "#17a2b8",
                "#6f42c1",
                "#fd7e14",
                "#20c997",
                "#6610f2"
            ],
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: "bottom"
            },
            title: {
                display: true,
                text: "Employees Per Department",
                font: { size: 18 }
            }
        }
    }
});

function showFeedbackForm() {
    document.getElementById("mainDashboard").style.display = "none";
    document.getElementById("employeeSection").style.display = "none";
    document.getElementById("feedbackSection").style.display = "block";
}

document.getElementById("employeeFeedbackForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const feedbackData = {
        name: document.getElementById("feedbackName").value,
        department: document.getElementById("feedbackDepartment").value,
        rating: document.getElementById("feedbackRating").value,
        message: document.getElementById("feedbackMessage").value
    };

    alert("Thank you! Feedback submitted:\n\n" +
          "Name: " + feedbackData.name + "\n" +
          "Dept: " + feedbackData.department + "\n" +
          "Rating: " + feedbackData.rating + "\n" +
          "Message: " + feedbackData.message);

    document.getElementById("employeeFeedbackForm").reset();
});
function downloadPayslip() {
    hrSystem.downloadPayslip();
}
