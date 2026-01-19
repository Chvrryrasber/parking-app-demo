const DEMO_MODE = true; 
const { createApp } = Vue;

// API Base URL
const API_URL = "http://localhost:5000";

// Main App
createApp({
    data() {
        return {
            currentView: 'login',
            user: null,
            token: null,
            loading: false,
            error: null,
            success: null,

            // Login form
            loginForm: {
                username: '',
                password: ''
            },

            // Register form
            registerForm: {
                username: '',
                email: '',
                password: '',
                confirmPassword: ''
            },

            // Admin data
            adminData: {
                stats: null,
                parkingLots: [],
                users: []
            },

            // User data
            userData: {
                parkingLots: [],
                reservations: []
            },

            // New parking lot form
            newLotForm: {
                name: '',
                address: '',
                pincode: '',
                price_per_hour: '',
                total_spots: ''
            },

            // Edit parking lot form
            editLotForm: {
                id: null,
                name: '',
                address: '',
                pincode: '',
                price_per_hour: '',
                total_spots: ''
            },

            showNewLotModal: false,
            showEditLotModal: false,
            searchQuery: '',
            // User dashboard modals
            showBookingModal: false,
            showReleaseModal: false,
            selectedLot: null,
            selectedReservation: null
        };
    },

    computed: {
        filteredParkingLots() {
            if (!this.searchQuery) {
                return this.adminData.parkingLots;
            }

            const query = this.searchQuery.toLowerCase();
            return this.adminData.parkingLots.filter(lot => 
                lot.name.toLowerCase().includes(query) ||
                lot.address.toLowerCase().includes(query) ||
                lot.pincode.includes(query)
            );
        },

        activeReservations() {
            return this.userData.reservations.filter(res => res.status === 'active');
        },

        completedReservations() {
            return this.userData.reservations.filter(res => res.status === 'completed');
        }
    },

    methods: {
        navigateTo(view) {
            this.currentView = view;
            this.error = null;
            this.success = null;
        },

        clearMessages() {
            this.error = null;
            this.success = null;
        },

        showError(message) {
            this.error = message;
            setTimeout(() => {
                this.error = null;
            }, 5000);
        },

        showSuccess(message) {
            this.success = message;
            setTimeout(() => {
                this.success = null;
            }, 5000);
        },

        async apiCall(endpoint, method = 'GET', data = null) {
            this.loading = true;

            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (this.token) {
                options.headers['Authorization'] = `Bearer ${this.token}`;
            }

            if (data) {
                options.body = JSON.stringify(data);
            }

            try {
                const response = await fetch(`${API_URL}${endpoint}`, options);
                const result = await response.json();

                this.loading = false;

                if (!response.ok) {
                    throw new Error(result.error || 'Something went wrong');
                }

                return result;
            } catch (error) {
                this.loading = false;
                throw error;
            }
        },

        async checkSchedulerStatus() {
            try {
                const result = await this.apiCall('/api/scheduler/status');
                console.log('Scheduler Status:', result);
                this.showSuccess(`Scheduler is ${result.running ? 'running' : 'stopped'}. ${result.jobs.length} jobs scheduled.`);
            } catch (error) {
                this.showError(error.message);
            }
        },

        async triggerTestJob() {
            try {
                const result = await this.apiCall('/api/scheduler/trigger/test_job');
                this.showSuccess('Test job triggered! Check console logs.');
            } catch (error) {
                this.showError(error.message);
            }
        },

        async login() {
            this.clearMessages();
            // ===== DEMO MODE LOGIN =====
            if (DEMO_MODE) {
                const username = this.loginForm.username;

                this.user = {
                    username: username,
                    role: username === 'admin' ? 'admin' : 'user'
                };

                this.token = 'demo-token';

                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));

                this.showSuccess('Logged in (Demo Mode)');

                if (this.user.role === 'admin') {
                    this.navigateTo('admin-dashboard');
                    this.loadAdminDashboard();
                } else {
                    this.navigateTo('user-dashboard');
                    this.loadUserDashboard();
                }

                this.loginForm = { username: '', password: '' };
                return;
            }
            // ===== END DEMO MODE =====

            if (!this.loginForm.username || !this.loginForm.password) {
                this.showError('Please enter username and password');
                return;
            }

            try {
                const result = await this.apiCall('/api/auth/login', 'POST', this.loginForm);

                this.token = result.access_token;
                this.user = result.user;

                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));

                this.showSuccess('Login successful!');

                if (this.user.role === 'admin') {
                    this.navigateTo('admin-dashboard');
                    this.loadAdminDashboard();
                } else {
                    this.navigateTo('user-dashboard');
                    this.loadUserDashboard();
                }

                this.loginForm = { username: '', password: '' };

            } catch (error) {
                this.showError(error.message);
            }
        },

        async register() {
            this.clearMessages();

            if (!this.registerForm.username || !this.registerForm.email || !this.registerForm.password) {
                this.showError('Please fill all fields');
                return;
            }

            if (this.registerForm.password !== this.registerForm.confirmPassword) {
                this.showError('Passwords do not match');
                return;
            }

            if (this.registerForm.password.length < 6) {
                this.showError('Password must be at least 6 characters');
                return;
            }

            try {
                await this.apiCall('/api/auth/register', 'POST', {
                    username: this.registerForm.username,
                    email: this.registerForm.email,
                    password: this.registerForm.password
                });

                this.showSuccess('Registration successful! Please login.');
                this.navigateTo('login');
                this.loginForm.username = this.registerForm.username;
                this.registerForm = { username: '', email: '', password: '', confirmPassword: '' };

            } catch (error) {
                this.showError(error.message);
            }
        },

        logout() {
            this.token = null;
            this.user = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            this.navigateTo('login');
            this.showSuccess('Logged out successfully');
        },

        async loadAdminDashboard() {

    // 🔥 DEMO MODE
    if (DEMO_MODE) {

        // Fake dashboard stats
        this.adminData.stats = {
            total_lots: 3,
            total_spots: 250,
            available_spots: 125,
            occupied_spots: 125,
            active_reservations: 14,
            total_users: 42
        };

        // Fake parking lots
        this.adminData.parkingLots = [
            {
                id: 1,
                name: "City Center Parking",
                total_spots: 50,
                available_spots: 18,
                occupied_spots: 32
            },
            {
                id: 2,
                name: "Mall Parking",
                total_spots: 80,
                available_spots: 42,
                occupied_spots: 38
            },
            {
                id: 3,
                name: "Airport Parking",
                total_spots: 120,
                available_spots: 65,
                occupied_spots: 55
            }
        ];

        this.$nextTick(() => {
            this.renderAdminCharts();
        });

        return;
    }

    // 🔴 REAL BACKEND MODE (kept for future)
    try {
        const stats = await this.apiCall('/api/admin/dashboard');
        this.adminData.stats = stats;

        const lots = await this.apiCall('/api/admin/parking-lots');
        this.adminData.parkingLots = lots.parking_lots;

        this.$nextTick(() => {
            this.renderAdminCharts();
        });

    } catch (error) {
        this.showError(error.message);
    }
},


        renderAdminCharts() {
            this.renderOccupancyChart();
            this.renderLotsComparisonChart();
        },

        renderOccupancyChart() {
            const canvas = document.getElementById('occupancyChart');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');

            if (window.occupancyChartInstance) {
                window.occupancyChartInstance.destroy();
            }

            const stats = this.adminData.stats;
            if (!stats) return;

            window.occupancyChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Available Spots', 'Occupied Spots'],
                    datasets: [{
                        data: [stats.available_spots, stats.occupied_spots],
                        backgroundColor: [
                            'rgba(40, 167, 69, 0.8)',
                            'rgba(220, 53, 69, 0.8)'
                        ],
                        borderColor: [
                            'rgba(40, 167, 69, 1)',
                            'rgba(220, 53, 69, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                        }
                    }
                }
            });
        },

        renderLotsComparisonChart() {
            const canvas = document.getElementById('lotsChart');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');

            if (window.lotsChartInstance) {
                window.lotsChartInstance.destroy();
            }

            const lots = this.adminData.parkingLots;
            if (!lots || lots.length === 0) {
                ctx.font = '16px Arial';
                ctx.fillStyle = '#999';
                ctx.textAlign = 'center';
                ctx.fillText('No parking lots to display', canvas.width / 2, canvas.height / 2);
                return;
            }

            const labels = lots.map(lot => lot.name);
            const availableData = lots.map(lot => lot.available_spots);
            const occupiedData = lots.map(lot => lot.occupied_spots);

            window.lotsChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Available',
                            data: availableData,
                            backgroundColor: 'rgba(40, 167, 69, 0.8)',
                            borderColor: 'rgba(40, 167, 69, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Occupied',
                            data: occupiedData,
                            backgroundColor: 'rgba(220, 53, 69, 0.8)',
                            borderColor: 'rgba(220, 53, 69, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    }
                }
            });
        },

        async loadUserDashboard() {

            // 🔥 DEMO MODE
            if (DEMO_MODE) {

                // Fake parking lots
                this.userData.parkingLots = [
                    {
                        id: 1,
                        name: "City Center Parking",
                        total_slots: 50,
                        available_slots: 18,
                        price_per_hour: 40
                    },
                    {
                        id: 2,
                        name: "Mall Parking",
                        total_slots: 80,
                        available_slots: 42,
                        price_per_hour: 30
                    },
                    {
                        id: 3,
                        name: "Airport Parking",
                        total_slots: 120,
                        available_slots: 65,
                        price_per_hour: 60
                    }
                ];

                // Fake reservations
                this.userData.reservations = [
                    {
                        id: 101,
                        lot_name: "City Center Parking",
                        status: "active",
                        cost: 120
                    },
                    {
                        id: 102,
                        lot_name: "Mall Parking",
                        status: "completed",
                        cost: 90
                    },
                    {
                        id: 103,
                        lot_name: "Airport Parking",
                        status: "completed",
                        cost: 180
                    }
                ];

                this.$nextTick(() => {
                    this.renderUserCharts();
                });

                return;
            }

            // 🔴 REAL BACKEND MODE (kept for future)
            try {
                const lots = await this.apiCall('/api/user/parking-lots');
                this.userData.parkingLots = lots.parking_lots;

                const reservations = await this.apiCall('/api/user/my-reservations');
                this.userData.reservations = reservations.reservations;

                this.$nextTick(() => {
                    this.renderUserCharts();
                });

            } catch (error) {
                this.showError(error.message);
            }
        },


        renderUserCharts() {
            if (this.userData.reservations.length > 0) {
                this.renderUserActivityChart();
                this.renderUserSpendingChart();
            }
        },

        renderUserActivityChart() {
            const canvas = document.getElementById('userActivityChart');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');

            if (window.userActivityChartInstance) {
                window.userActivityChartInstance.destroy();
            }

            const active = this.userData.reservations.filter(r => r.status === 'active').length;
            const completed = this.userData.reservations.filter(r => r.status === 'completed').length;

            window.userActivityChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Active', 'Completed'],
                    datasets: [{
                        label: 'Number of Reservations',
                        data: [active, completed],
                        backgroundColor: [
                            'rgba(40, 167, 69, 0.8)',
                            'rgba(108, 117, 125, 0.8)'
                        ],
                        borderColor: [
                            'rgba(40, 167, 69, 1)',
                            'rgba(108, 117, 125, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        },

        renderUserSpendingChart() {
            const canvas = document.getElementById('userSpendingChart');
            if (!canvas) return;

            const ctx = canvas.getContext('2d');

            if (window.userSpendingChartInstance) {
                window.userSpendingChartInstance.destroy();
            }

            const spendingByLot = {};
            const completedReservations = this.userData.reservations.filter(r => r.status === 'completed');

            if (completedReservations.length === 0) {
                ctx.font = '16px Arial';
                ctx.fillStyle = '#999';
                ctx.textAlign = 'center';
                ctx.fillText('No spending data yet', canvas.width / 2, canvas.height / 2);
                return;
            }

            completedReservations.forEach(reservation => {
                const lotName = reservation.lot_name;
                const cost = parseFloat(reservation.cost) || 0;

                if (spendingByLot[lotName]) {
                    spendingByLot[lotName] += cost;
                } else {
                    spendingByLot[lotName] = cost;
                }
            });

            const labels = Object.keys(spendingByLot);
            const data = Object.values(spendingByLot);

            const colors = [
                'rgba(102, 126, 234, 0.8)',
                'rgba(118, 75, 162, 0.8)',
                'rgba(237, 100, 166, 0.8)',
                'rgba(255, 159, 64, 0.8)',
                'rgba(75, 192, 192, 0.8)',
            ];

            window.userSpendingChartInstance = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors.slice(0, labels.length),
                        borderColor: colors.slice(0, labels.length).map(c => c.replace('0.8', '1')),
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ₹' + context.parsed.toFixed(2);
                                }
                            }
                        }
                    }
                }
            });
        },

        async exportCSV() {
            this.clearMessages();

            if (this.userData.reservations.length === 0) {
                this.showError('No reservations to export');
                return;
            }

            try {
                this.loading = true;

                const response = await fetch(`${API_URL}/api/user/export-csv`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to export CSV');
                }

                const blob = await response.blob();

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `parking_history_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();

                // Cleanup
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                this.loading = false;
                this.showSuccess('CSV exported successfully!');

            } catch (error) {
                this.loading = false;
                this.showError(error.message);
            }
        },

        async triggerExportWithStatus() {
            this.showSuccess('Preparing your export... This may take a moment.');
            await this.exportCSV();
        },

        async createParkingLot() {
    this.clearMessages();

    // 🔥 DEMO MODE
    if (DEMO_MODE) {

        // Basic validation
        if (
            !this.newLotForm.name ||
            !this.newLotForm.price_per_hour ||
            !this.newLotForm.total_spots
        ) {
            this.showError("Please fill all required fields");
            return;
        }

        // Create fake lot
        const newLot = {
            id: Date.now(), // fake unique id
            name: this.newLotForm.name,
            address: this.newLotForm.address || "Demo Address",
            pincode: this.newLotForm.pincode || "000000",
            price_per_hour: Number(this.newLotForm.price_per_hour),
            total_spots: Number(this.newLotForm.total_spots),
            available_spots: Number(this.newLotForm.total_spots),
            occupied_spots: 0
        };

        // Add lot to admin list
        this.adminData.parkingLots.push(newLot);

        // Update stats
        this.adminData.stats.total_spots += newLot.total_spots;
        this.adminData.stats.available_spots += newLot.total_spots;

        this.showSuccess("Parking lot created successfully! (Demo Mode)");
        this.showNewLotModal = false;

        // Reset form
        this.newLotForm = {
            name: '',
            address: '',
            pincode: '',
            price_per_hour: '',
            total_spots: ''
        };

        // Refresh charts
        this.$nextTick(() => {
            this.renderAdminCharts();
        });

        return;
    }

    // 🔴 REAL BACKEND MODE (kept for future)
    try {
        const result = await this.apiCall(
            '/api/admin/parking-lots',
            'POST',
            this.newLotForm
        );

        this.showSuccess('Parking lot created successfully!');
        this.showNewLotModal = false;

        this.newLotForm = {
            name: '',
            address: '',
            pincode: '',
            price_per_hour: '',
            total_spots: ''
        };

        this.loadAdminDashboard();

    } catch (error) {
        this.showError(error.message);
    }
},

        async deleteParkingLot(lotId) {
    if (!confirm('Are you sure you want to delete this parking lot?')) {
        return;
    }

    this.clearMessages();

    // 🔥 DEMO MODE
    if (DEMO_MODE) {

        const lotIndex = this.adminData.parkingLots.findIndex(
            lot => lot.id === lotId
        );

        if (lotIndex === -1) {
            this.showError("Parking lot not found");
            return;
        }

        const lot = this.adminData.parkingLots[lotIndex];

        // Update stats
        this.adminData.stats.total_spots -= lot.total_spots;
        this.adminData.stats.available_spots -= lot.available_spots;
        this.adminData.stats.occupied_spots -= lot.occupied_spots;

        // Remove lot
        this.adminData.parkingLots.splice(lotIndex, 1);

        this.showSuccess('Parking lot deleted successfully! (Demo Mode)');

        // Refresh charts
        this.$nextTick(() => {
            this.renderAdminCharts();
        });

        return;
    }

    // 🔴 REAL BACKEND MODE (kept for future)
    try {
        await this.apiCall(
            `/api/admin/parking-lots/${lotId}`,
            'DELETE'
        );

        this.showSuccess('Parking lot deleted successfully!');
        this.loadAdminDashboard();

    } catch (error) {
        this.showError(error.message);
    }
},


        openEditModal(lot) {
            this.editLotForm = {
                id: lot.id,
                name: lot.name,
                address: lot.address,
                pincode: lot.pincode,
                price_per_hour: lot.price_per_hour,
                total_spots: lot.total_spots
            };
            this.showEditLotModal = true;
        },

        async updateParkingLot() {
            this.clearMessages();

            try {
                await this.apiCall(
                    `/api/admin/parking-lots/${this.editLotForm.id}`, 
                    'PUT', 
                    this.editLotForm
                );

                this.showSuccess('Parking lot updated successfully!');
                this.showEditLotModal = false;
                this.loadAdminDashboard();

            } catch (error) {
                this.showError(error.message);
            }
        },

        async loadAllUsers() {
            try {
                const result = await this.apiCall('/api/admin/users');
                this.adminData.users = result.users;

            } catch (error) {
                this.showError(error.message);
            }
        },

        confirmBooking(lot) {
            this.selectedLot = lot;
            this.showBookingModal = true;
        },

        async bookParkingSpot() {
    if (!this.selectedLot) return;

    this.clearMessages();

    // 🔥 DEMO MODE
    if (DEMO_MODE) {

        // Reduce available slots
        if (this.selectedLot.available_slots <= 0) {
            this.showError("No slots available in this parking lot");
            return;
        }

        this.selectedLot.available_slots -= 1;

        // Create fake reservation
        const newReservation = {
            id: Date.now(), // fake unique id
            lot_name: this.selectedLot.name,
            status: "active",
            cost: this.selectedLot.price_per_hour
        };

        // Add to reservations
        this.userData.reservations.unshift(newReservation);

        this.showSuccess("Parking spot booked successfully (Demo Mode)");
        this.showBookingModal = false;
        this.selectedLot = null;

        // Refresh charts
        this.$nextTick(() => {
            this.renderUserCharts();
        });

        return;
    }

    // 🔴 REAL BACKEND MODE (unchanged)
    try {
        const result = await this.apiCall('/api/user/book', 'POST', {
            lot_id: this.selectedLot.id
        });

        this.showSuccess(`Parking spot ${result.reservation.spot_number} booked successfully!`);
        this.showBookingModal = false;
        this.selectedLot = null;

        this.loadUserDashboard();

    } catch (error) {
        this.showError(error.message);
    }
},

        async releaseParkingSpot() {
    if (!this.selectedReservation) return;

    this.clearMessages();

    // 🔥 DEMO MODE
    if (DEMO_MODE) {

        // Mark reservation as completed
        this.selectedReservation.status = "completed";

        // Fake cost & duration
        const durationHours = Math.floor(Math.random() * 5) + 1;
        const parkingCost = this.selectedReservation.cost * durationHours;

        // Increase available slots in the corresponding lot
        const lot = this.userData.parkingLots.find(
            lot => lot.name === this.selectedReservation.lot_name
        );

        if (lot) {
            lot.available_slots += 1;
        }

        this.showSuccess(
            `Spot released! Cost: ₹${parkingCost} for ${durationHours} hours (Demo Mode)`
        );

        this.showReleaseModal = false;
        this.selectedReservation = null;

        // Refresh charts
        this.$nextTick(() => {
            this.renderUserCharts();
        });

        return;
    }

    // 🔴 REAL BACKEND MODE (kept for future)
    try {
        const result = await this.apiCall(
            `/api/user/release/${this.selectedReservation.id}`, 
            'PUT'
        );

        this.showSuccess(
            `Spot released! Cost: ₹${result.parking_cost} for ${result.duration_hours} hours`
        );

        this.showReleaseModal = false;
        this.selectedReservation = null;

        this.loadUserDashboard();

    } catch (error) {
        this.showError(error.message);
    }
},

        async loadMyReservations() {
            try {
                const result = await this.apiCall('/api/user/my-reservations');
                this.userData.reservations = result.reservations;
                this.renderUserCharts();
            } catch (error) {
                this.showError(error.message);
            }
        },

        formatDateTime(dateString) {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleString('en-IN', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit', 
                minute: '2-digit'
            });
        },

        formatDate(dateString) {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric'
            });
        },

        formatDuration(startTime, endTime) {
            if (!startTime || !endTime) return 'N/A';
            const start = new Date(startTime);
            const end = new Date(endTime);
            const hours = Math.abs(end - start) / 36e5;
            return `${hours.toFixed(1)} hrs`;
        },

        calculateDuration(startTime) {
            if (!startTime) return 'N/A';
            const start = new Date(startTime);
            const now = new Date();
            const minutes = Math.floor((now - start) / 60000);

            if (minutes < 60) {
                return `${minutes} min`;
            } else {
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                return `${hours}h ${mins}m`;
            }
        },

        checkAuth() {
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');

            if (token && user) {
                this.token = token;
                this.user = JSON.parse(user);

                if (this.user.role === 'admin') {
                    this.navigateTo('admin-dashboard');
                    this.loadAdminDashboard();
                } else {
                    this.navigateTo('user-dashboard');
                    this.loadUserDashboard();
                }
            }
        }
    },

    mounted() {
        this.checkAuth();
    },

    template: `
        <div id="app">
            <!-- Login Page -->
            <div v-if="currentView === 'login'" class="page-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <i class="fas fa-parking fa-3x mb-3"></i>
                        <h2>Parking App</h2>
                        <p>Login to your account</p>
                    </div>

                    <div class="auth-body">
                        <div v-if="error" class="alert alert-danger">
                            <i class="fas fa-exclamation-circle"></i> {{ error }}
                        </div>

                        <div v-if="success" class="alert alert-success">
                            <i class="fas fa-check-circle"></i> {{ success }}
                        </div>

                        <form @submit.prevent="login">
                            <div class="form-group">
                                <label class="form-label">Username</label>
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    v-model="loginForm.username"
                                    placeholder="Enter your username"
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label">Password</label>
                                <input 
                                    type="password" 
                                    class="form-control" 
                                    v-model="loginForm.password"
                                    placeholder="Enter your password"
                                    required
                                >
                            </div>

                            <button type="submit" class="btn btn-primary" :disabled="loading">
                                <span v-if="loading">
                                    <i class="fas fa-spinner fa-spin"></i> Logging in...
                                </span>
                                <span v-else>
                                    <i class="fas fa-sign-in-alt"></i> Login
                                </span>
                            </button>
                        </form>

                        <div class="text-center mt-3">
                            <p>Don't have an account? 
                                <a href="#" @click.prevent="navigateTo('register')" class="text-link">Register here</a>
                            </p>
                        </div>

                        <div class="text-center mt-2">
                            <small class="text-muted">
                                Admin credentials: <strong>admin / admin123</strong>
                            </small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Register Page -->
            <div v-if="currentView === 'register'" class="page-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <i class="fas fa-user-plus fa-3x mb-3"></i>
                        <h2>Create Account</h2>
                        <p>Register for a new account</p>
                    </div>

                    <div class="auth-body">
                        <div v-if="error" class="alert alert-danger">
                            <i class="fas fa-exclamation-circle"></i> {{ error }}
                        </div>

                        <form @submit.prevent="register">
                            <div class="form-group">
                                <label class="form-label">Username</label>
                                <input 
                                    type="text" 
                                    class="form-control" 
                                    v-model="registerForm.username"
                                    placeholder="Choose a username"
                                    required
                                    minlength="3"
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input 
                                    type="email" 
                                    class="form-control" 
                                    v-model="registerForm.email"
                                    placeholder="Enter your email"
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label">Password</label>
                                <input 
                                    type="password" 
                                    class="form-control" 
                                    v-model="registerForm.password"
                                    placeholder="Create a password"
                                    required
                                    minlength="6"
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label">Confirm Password</label>
                                <input 
                                    type="password" 
                                    class="form-control" 
                                    v-model="registerForm.confirmPassword"
                                    placeholder="Confirm your password"
                                    required
                                >
                            </div>

                            <button type="submit" class="btn btn-primary" :disabled="loading">
                                <span v-if="loading">
                                    <i class="fas fa-spinner fa-spin"></i> Creating account...
                                </span>
                                <span v-else>
                                    <i class="fas fa-user-plus"></i> Register
                                </span>
                            </button>
                        </form>

                        <div class="text-center mt-3">
                            <p>Already have an account? 
                                <a href="#" @click.prevent="navigateTo('login')" class="text-link">Login here</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Admin Dashboard -->
            <div v-if="currentView === 'admin-dashboard'" class="dashboard-container">
                <nav class="navbar navbar-expand-lg navbar-light">
                    <div class="container-fluid">
                        <span class="navbar-brand">
                            <i class="fas fa-parking"></i> Parking App - Admin
                        </span>
                        <div class="d-flex align-items-center">
                            <span class="me-3">
                                <i class="fas fa-user-shield"></i> {{ user.username }}
                            </span>
                            <button class="btn btn-outline-danger btn-sm" @click="logout">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    </div>
                </nav>

                <div class="container-fluid mt-4 px-4">
                    <div v-if="error" class="alert alert-danger alert-dismissible fade show">
                        <i class="fas fa-exclamation-circle"></i> {{ error }}
                        <button type="button" class="btn-close" @click="error = null"></button>
                    </div>

                    <div v-if="success" class="alert alert-success alert-dismissible fade show">
                        <i class="fas fa-check-circle"></i> {{ success }}
                        <button type="button" class="btn-close" @click="success = null"></button>
                    </div>

                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2><i class="fas fa-tachometer-alt"></i> Admin Dashboard</h2>
                        <button class="btn btn-primary" @click="showNewLotModal = true">
                            <i class="fas fa-plus-circle"></i> Create Parking Lot
                        </button>
                    </div>

                    <div class="row mb-4" v-if="adminData.stats">
                        <div class="col-md-3 col-sm-6 mb-3">
                            <div class="card stat-card">
                                <div class="card-body">
                                    <i class="fas fa-parking fa-2x text-primary mb-2"></i>
                                    <div class="stat-number">{{ adminData.stats.total_parking_lots }}</div>
                                    <div class="stat-label">Total Parking Lots</div>
                                </div>
                            </div>
                        </div>

                        <div class="col-md-3 col-sm-6 mb-3">
                            <div class="card stat-card">
                                <div class="card-body">
                                    <i class="fas fa-square-parking fa-2x text-success mb-2"></i>
                                    <div class="stat-number">{{ adminData.stats.available_spots }}</div>
                                    <div class="stat-label">Available Spots</div>
                                </div>
                            </div>
                        </div>

                        <div class="col-md-3 col-sm-6 mb-3">
                            <div class="card stat-card">
                                <div class="card-body">
                                    <i class="fas fa-car fa-2x text-danger mb-2"></i>
                                    <div class="stat-number">{{ adminData.stats.occupied_spots }}</div>
                                    <div class="stat-label">Occupied Spots</div>
                                </div>
                            </div>
                        </div>

                        <div class="col-md-3 col-sm-6 mb-3">
                            <div class="card stat-card">
                                <div class="card-body">
                                    <i class="fas fa-users fa-2x text-info mb-2"></i>
                                    <div class="stat-number">{{ adminData.stats.total_users }}</div>
                                    <div class="stat-label">Total Users</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Admin Charts -->
                        <div class="row mb-4" v-if="adminData.stats">
                            <div class="col-md-6 mb-3">
                                <div class="card">
                                    <div class="card-header bg-white">
                                        <h6 class="mb-0"><i class="fas fa-chart-pie"></i> Spot Occupancy</h6>
                                    </div>
                                    <div class="card-body" style="height: 300px;">
                                        <canvas id="occupancyChart"></canvas>
                                    </div>
                                </div>
                            </div>

                            <div class="col-md-6 mb-3">
                                <div class="card">
                                    <div class="card-header bg-white">
                                        <h6 class="mb-0"><i class="fas fa-chart-bar"></i> Parking Lots Comparison</h6>
                                                                        </div>
                                                                        <div class="card-body" style="height: 300px;">
                                                                            <canvas id="lotsChart"></canvas>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div v-if="loading" class="loading">
                                                                <div class="spinner"></div>
                                                                <p class="mt-3">Loading dashboard data...</p>
                                                            </div>

                                                            <div v-else class="card">
                                                                <div class="card-header bg-white">
                                                                    <h5 class="mb-0"><i class="fas fa-list"></i> Parking Lots Management</h5>
                                                                </div>
                                                                <div class="card-body">
                                                                    <div class="mb-3">
                                                                        <div class="input-group">
                                                                            <span class="input-group-text">
                                                                                <i class="fas fa-search"></i>
                                                                            </span>
                                                                            <input 
                                                                                type="text" 
                                                                                class="form-control" 
                                                                                v-model="searchQuery"
                                                                                placeholder="Search by name, address, or pincode..."
                                                                            >
                                                                            <button 
                                                                                v-if="searchQuery" 
                                                                                class="btn btn-outline-secondary" 
                                                                                @click="searchQuery = ''"
                                                                            >
                                                                                <i class="fas fa-times"></i> Clear
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    <div v-if="adminData.parkingLots.length === 0" class="text-center py-5 text-muted">
                                                                        <i class="fas fa-inbox fa-3x mb-3"></i>
                                                                        <p>No parking lots created yet.</p>
                                                                        <button class="btn btn-primary" @click="showNewLotModal = true">
                                                                            <i class="fas fa-plus"></i> Create Your First Parking Lot
                                                                        </button>
                                                                    </div>

                                                                    <div v-else-if="filteredParkingLots.length === 0" class="text-center py-5 text-muted">
                                                                        <i class="fas fa-search fa-3x mb-3"></i>
                                                                        <p>No parking lots match your search.</p>
                                                                        <button class="btn btn-outline-primary" @click="searchQuery = ''">
                                                                            Clear Search
                                                                        </button>
                                                                    </div>

                                                                    <div v-else class="table-responsive">
                                                                        <table class="table table-hover">
                                                                            <thead>
                                                                                <tr>
                                                                                    <th>ID</th>
                                                                                    <th>Name</th>
                                                                                    <th>Address</th>
                                                                                    <th>Pincode</th>
                                                                                    <th>Price/Hour</th>
                                                                                    <th>Total Spots</th>
                                                                                    <th>Available</th>
                                                                                    <th>Occupied</th>
                                                                                    <th>Actions</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                <tr v-for="lot in filteredParkingLots" :key="lot.id">
                                                                                    <td>{{ lot.id }}</td>
                                                                                    <td><strong>{{ lot.name }}</strong></td>
                                                                                    <td>{{ lot.address }}</td>
                                                                                    <td>{{ lot.pincode }}</td>
                                                                                    <td>₹{{ lot.price_per_hour }}</td>
                                                                                    <td>{{ lot.total_spots }}</td>
                                                                                    <td>
                                                                                        <span class="badge badge-available">
                                                                                            {{ lot.available_spots }}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td>
                                                                                        <span class="badge badge-occupied">
                                                                                            {{ lot.occupied_spots }}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td>
                                                                                        <button 
                                                                                            class="btn btn-sm btn-primary me-1" 
                                                                                            @click="openEditModal(lot)"
                                                                                            title="Edit"
                                                                                        >
                                                                                            <i class="fas fa-edit"></i>
                                                                                        </button>
                                                                                        <button 
                                                                                            class="btn btn-sm btn-danger" 
                                                                                            @click="deleteParkingLot(lot.id)"
                                                                                            :disabled="lot.occupied_spots > 0"
                                                                                            :title="lot.occupied_spots > 0 ? 'Cannot delete - spots occupied' : 'Delete'"
                                                                                        >
                                                                                            <i class="fas fa-trash"></i>
                                                                                        </button>
                                                                                    </td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div class="mt-4">
                                                                <button class="btn btn-outline-primary" @click="loadAllUsers">
                                                                    <i class="fas fa-users"></i> View All Users
                                                                </button>
                                                            </div>

                                                            <div v-if="adminData.users.length > 0" class="card mt-3">
                                                                <div class="card-header bg-white">
                                                                    <h5 class="mb-0"><i class="fas fa-users"></i> Registered Users</h5>
                                                                </div>
                                                                <div class="card-body">
                                                                    <div class="table-responsive">
                                                                        <table class="table table-hover">
                                                                            <thead>
                                                                                <tr>
                                                                                    <th>ID</th>
                                                                                    <th>Username</th>
                                                                                    <th>Email</th>
                                                                                    <th>Registered On</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                <tr v-for="user in adminData.users" :key="user.id">
                                                                                    <td>{{ user.id }}</td>
                                                                                    <td><i class="fas fa-user"></i> {{ user.username }}</td>
                                                                                    <td>{{ user.email }}</td>
                                                                                    <td>{{ user.created_at }}</td>
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <!-- Create Modal -->
                                                        <div v-if="showNewLotModal" class="modal-backdrop" @click="showNewLotModal = false">
                                                            <div class="modal-dialog" @click.stop>
                                                                <div class="modal-content">
                                                                    <div class="modal-header">
                                                                        <h5 class="modal-title">
                                                                            <i class="fas fa-plus-circle"></i> Create New Parking Lot
                                                                        </h5>
                                                                        <button class="btn-close" @click="showNewLotModal = false"></button>
                                                                    </div>
                                                                    <div class="modal-body">
                                                                        <form @submit.prevent="createParkingLot">
                                                                            <div class="mb-3">
                                                                                <label class="form-label">Parking Lot Name *</label>
                                                                                <input type="text" class="form-control" v-model="newLotForm.name" required>
                                                                            </div>
                                                                            <div class="mb-3">
                                                                                <label class="form-label">Address *</label>
                                                                                <input type="text" class="form-control" v-model="newLotForm.address" required>
                                                                            </div>
                                                                            <div class="mb-3">
                                                                                <label class="form-label">Pincode *</label>
                                                                                <input type="text" class="form-control" v-model="newLotForm.pincode" required pattern="[0-9]{6}">
                                                                            </div>
                                                                            <div class="mb-3">
                                                                                <label class="form-label">Price per Hour (₹) *</label>
                                                                                <input type="number" class="form-control" v-model="newLotForm.price_per_hour" required min="1">
                                                                            </div>
                                                                            <div class="mb-3">
                                                                                <label class="form-label">Total Parking Spots *</label>
                                                                                <input type="number" class="form-control" v-model="newLotForm.total_spots" required min="1" max="500">
                                                                            </div>
                                                                            <div class="d-flex gap-2">
                                                                                <button type="submit" class="btn btn-primary flex-grow-1" :disabled="loading">
                                                                                    <span v-if="loading"><i class="fas fa-spinner fa-spin"></i> Creating...</span>
                                                                                    <span v-else><i class="fas fa-check"></i> Create Parking Lot</span>
                                                                                </button>
                                                                                <button type="button" class="btn btn-secondary" @click="showNewLotModal = false">Cancel</button>
                                                                            </div>
                                                                        </form>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <!-- Edit Modal -->
                                                        <div v-if="showEditLotModal" class="modal-backdrop" @click="showEditLotModal = false">
                                                            <div class="modal-dialog" @click.stop>
                                                                <div class="modal-content">
                                                                    <div class="modal-header">
                                                                        <h5 class="modal-title">
                                                                            <i class="fas fa-edit"></i> Edit Parking Lot
                                                                        </h5>
                                                                        <button class="btn-close" @click="showEditLotModal = false"></button>
                                                                    </div>
                                                                    <div class="modal-body">
                                                                        <form @submit.prevent="updateParkingLot">
                                                                            <div class="mb-3">
                                                                                <label class="form-label">Parking Lot Name *</label>
                                                                                <input type="text" class="form-control" v-model="editLotForm.name" required>
                                                                            </div>
                                                                            <div class="mb-3">
                                                                                <label class="form-label">Address *</label>
                                                                                <input type="text" class="form-control" v-model="editLotForm.address" required>
                                                                            </div>
                                                                            <div class="mb-3">
                                                                                <label class="form-label">Pincode *</label>
                                                                                <input type="text" class="form-control" v-model="editLotForm.pincode" required pattern="[0-9]{6}">
                                                                            </div>
                                                                            <div class="mb-3">
                                                                                <label class="form-label">Price per Hour (₹) *</label>
                                                                                <input type="number" class="form-control" v-model="editLotForm.price_per_hour" required min="1">
                                                                            </div>
                                                                            <div class="mb-3">
                                                                                <label class="form-label">Total Parking Spots *</label>
                                                                                <input type="number" class="form-control" v-model="editLotForm.total_spots" required min="1" max="500">
                                                                            </div>
                                                                            <div class="d-flex gap-2">
                                                                                <button type="submit" class="btn btn-primary flex-grow-1" :disabled="loading">
                                                                                    <span v-if="loading"><i class="fas fa-spinner fa-spin"></i> Updating...</span>
                                                                                    <span v-else><i class="fas fa-save"></i> Update Parking Lot</span>
                                                                                </button>
                                                                                <button type="button" class="btn btn-secondary" @click="showEditLotModal = false">Cancel</button>
                                                                            </div>
                                                                        </form>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <!-- User Dashboard -->
                                                    <div v-if="currentView === 'user-dashboard'" class="dashboard-container">
                                                        <nav class="navbar navbar-expand-lg navbar-light">
                                                            <div class="container-fluid">
                                                                <span class="navbar-brand">
                                                                    <i class="fas fa-parking"></i> Parking App
                                                                </span>
                                                                <div class="d-flex align-items-center">
                                                                    <span class="me-3">
                                                                        <i class="fas fa-user"></i> {{ user.username }}
                                                                    </span>
                                                                    <button class="btn btn-outline-danger btn-sm" @click="logout">
                                                                        <i class="fas fa-sign-out-alt"></i> Logout
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </nav>

                                                        <div class="container mt-4">
                                                            <div v-if="error" class="alert alert-danger alert-dismissible fade show">
                                                                <i class="fas fa-exclamation-circle"></i> {{ error }}
                                                                <button type="button" class="btn-close" @click="error = null"></button>
                                                            </div>

                                                            <div v-if="success" class="alert alert-success alert-dismissible fade show">
                                                                <i class="fas fa-check-circle"></i> {{ success }}
                                                                <button type="button" class="btn-close" @click="success = null"></button>
                                                            </div>

                                                            <div class="mb-4">
                                                                <h2><i class="fas fa-home"></i> Welcome, {{ user.username }}!</h2>
                                                                <p class="text-muted">Find and book your parking spot easily</p>
                                                            </div>

                                                            <div v-if="loading" class="loading">
                                                                <div class="spinner"></div>
                                                                <p class="mt-3">Loading parking lots...</p>
                                                            </div>

                                                            <div v-else>
                                                                <div class="d-flex justify-content-between align-items-center mb-3">
                                                                    <h4><i class="fas fa-parking"></i> Available Parking Lots</h4>
                                                                    <button class="btn btn-outline-primary btn-sm" @click="loadUserDashboard">
                                                                        <i class="fas fa-sync-alt"></i> Refresh
                                                                    </button>
                                                                </div>

                                                                <div v-if="userData.parkingLots.length === 0" class="text-center py-5">
                                                                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                                                                    <p class="text-muted">No parking lots available at the moment.</p>
                                                                </div>

                                                                <div v-else class="row">
                                                                    <div v-for="lot in userData.parkingLots" :key="lot.id" class="col-md-6 col-lg-4 mb-4">
                                                                        <div class="card parking-lot-card h-100">
                                                                            <div class="card-body">
                                                                                <div class="d-flex justify-content-between align-items-start mb-3">
                                                                                    <h5 class="card-title mb-0">
                                                                                        <i class="fas fa-building text-primary"></i>
                                                                                        {{ lot.name }}
                                                                                    </h5>
                                                                                    <span v-if="lot.available_spots > 0" class="badge bg-success">
                                                                                        {{ lot.available_spots }} Available
                                                                                    </span>
                                                                                    <span v-else class="badge bg-danger">Full</span>
                                                                                </div>

                                                                                <div class="mb-3">
                                                                                    <p class="mb-2">
                                                                                        <i class="fas fa-map-marker-alt text-danger"></i>
                                                                                        <small>{{ lot.address }}</small>
                                                                                    </p>
                                                                                    <p class="mb-2">
                                                                                        <i class="fas fa-map-pin text-info"></i>
                                                                                        <small>{{ lot.pincode }}</small>
                                                                                    </p>
                                                                                    <p class="mb-0">
                                                                                        <i class="fas fa-rupee-sign text-success"></i>
                                                                                        <strong>₹{{ lot.price_per_hour }}</strong> per hour
                                                                                    </p>
                                                                                </div>

                                                                                <div class="d-flex justify-content-between align-items-center">
                                                                                    <small class="text-muted">
                                                                                        <i class="fas fa-car"></i> {{ lot.total_spots }} Total Spots
                                                                                    </small>
                                                                                    <button 
                                                                                        class="btn btn-primary btn-sm"
                                                                                        @click="confirmBooking(lot)"
                                                                                        :disabled="lot.available_spots === 0"
                                                                                    >
                                                                                        <i class="fas fa-ticket-alt"></i>
                                                                                        {{ lot.available_spots > 0 ? 'Book Now' : 'Full' }}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div class="mt-5">
                                                                <div class="d-flex justify-content-between align-items-center mb-3">
                                                                    <h4><i class="fas fa-list-alt"></i> My Reservations</h4>
                                                                    <div class="d-flex gap-2">
                                                                        <button 
                                                                            class="btn btn-success btn-sm" 
                                                                            @click="triggerExportWithStatus"
                                                                            :disabled="userData.reservations.length === 0 || loading"
                                                                        >
                                                                            <i class="fas fa-file-csv"></i> Export CSV
                                                                        </button>
                                                                        <button class="btn btn-outline-secondary btn-sm" @click="loadMyReservations">
                                                                            <i class="fas fa-sync-alt"></i> Refresh
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            
                                                                <!-- User Charts -->
                                                                <div v-if="userData.reservations.length > 0" class="row mb-4">
                                                                    <div class="col-md-6 mb-3">
                                                                        <div class="card">
                                                                            <div class="card-header bg-white">
                                                                                <h6 class="mb-0"><i class="fas fa-chart-bar"></i> My Parking Activity</h6>
                                                                            </div>
                                                                            <div class="card-body" style="height: 300px;">
                                                                                <canvas id="userActivityChart"></canvas>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div class="col-md-6 mb-3">
                                                                        <div class="card">
                                                                            <div class="card-header bg-white">
                                                                                <h6 class="mb-0"><i class="fas fa-chart-pie"></i> Spending by Parking Lot</h6>
                                                                            </div>
                                                                            <div class="card-body" style="height: 300px;">
                                                                                <canvas id="userSpendingChart"></canvas>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div v-if="userData.reservations.length === 0" class="card">
                                                                    <div class="card-body text-center py-5">
                                                                        <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                                                                        <p class="text-muted">You haven't made any reservations yet.</p>
                                                                        <p class="text-muted">Book a parking spot to get started!</p>
                                                                    </div>
                                                                </div>

                                                                <div v-else>
                                                                    <div v-if="activeReservations.length > 0" class="mb-4">
                                                                        <h6 class="text-success mb-3">
                                                                            <i class="fas fa-clock"></i> Active Reservations ({{ activeReservations.length }})
                                                                        </h6>
                                                                        <div class="row">
                                                                            <div v-for="res in activeReservations" :key="res.id" class="col-md-6 mb-3">
                                                                                <div class="card border-success">
                                                                                    <div class="card-body">
                                                                                        <div class="d-flex justify-content-between align-items-start mb-2">
                                                                                            <div>
                                                                                                <h6 class="mb-1">{{ res.lot_name }}</h6>
                                                                                                <p class="mb-0">
                                                                                                    <span class="badge bg-success">{{ res.spot_number }}</span>
                                                                                                </p>
                                                                                            </div>
                                                                                            <span class="badge bg-warning text-dark">Active</span>
                                                                                        </div>
                                                                                        <hr>
                                                                                        <p class="mb-1 small">
                                                                                            <i class="fas fa-clock text-primary"></i>
                                                                                            Parked: {{ formatDateTime(res.parking_time) }}
                                                                                        </p>
                                                                                        <p class="mb-3 small">
                                                                                            <i class="fas fa-hourglass-half text-info"></i>
                                                                                            Duration: {{ calculateDuration(res.parking_time) }}
                                                                                        </p>
                                                                                        <button 
                                                                                            class="btn btn-danger btn-sm w-100"
                                                                                            @click="confirmRelease(res)"
                                                                                        >
                                                                                            <i class="fas fa-sign-out-alt"></i> Release Spot
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div v-if="completedReservations.length > 0">
                                                                        <h6 class="text-secondary mb-3">
                                                                            <i class="fas fa-history"></i> Past Reservations ({{ completedReservations.length }})
                                                                        </h6>
                                                                        <div class="card">
                                                                            <div class="card-body">
                                                                                <div class="table-responsive">
                                                                                    <table class="table table-sm">
                                                                                        <thead>
                                                                                            <tr>
                                                                                                <th>Parking Lot</th>
                                                                                                <th>Spot</th>
                                                                                                <th>Date</th>
                                                                                                <th>Duration</th>
                                                                                                <th>Cost</th>
                                                                                            </tr>
                                                                                        </thead>
                                                                                        <tbody>
                                                                                            <tr v-for="res in completedReservations" :key="res.id">
                                                                                                <td>{{ res.lot_name }}</td>
                                                                                                <td><span class="badge bg-secondary">{{ res.spot_number }}</span></td>
                                                                                                <td><small>{{ formatDate(res.parking_time) }}</small></td>
                                                                                                <td><small>{{ formatDuration(res.parking_time, res.leaving_time) }}</small></td>
                                                                                                <td><strong>₹{{ res.cost }}</strong></td>
                                                                                            </tr>
                                                                                        </tbody>
                                                                                    </table>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <!-- Booking Modal -->
                                                        <div v-if="showBookingModal" class="modal-backdrop" @click="showBookingModal = false">
                                                            <div class="modal-dialog" @click.stop>
                                                                <div class="modal-content">
                                                                    <div class="modal-header">
                                                                        <h5 class="modal-title">
                                                                            <i class="fas fa-ticket-alt"></i> Confirm Booking
                                                                        </h5>
                                                                        <button class="btn-close" @click="showBookingModal = false"></button>
                                                                    </div>
                                                                    <div class="modal-body">
                                                                        <div v-if="selectedLot">
                                                                            <h6>{{ selectedLot.name }}</h6>
                                                                            <p class="mb-2"><i class="fas fa-map-marker-alt"></i> {{ selectedLot.address }}</p>
                                                                            <p class="mb-3"><i class="fas fa-rupee-sign"></i> <strong>₹{{ selectedLot.price_per_hour }}</strong> per hour</p>

                                                                            <div class="alert alert-info">
                                                                                <i class="fas fa-info-circle"></i>
                                                                                <small>A parking spot will be automatically assigned to you upon confirmation.</small>
                                                                            </div>

                                                                            <div class="d-flex gap-2">
                                                                                <button 
                                                                                    class="btn btn-primary flex-grow-1" 
                                                                                    @click="bookParkingSpot"
                                                                                    :disabled="loading"
                                                                                >
                                                                                    <span v-if="loading">
                                                                                        <i class="fas fa-spinner fa-spin"></i> Booking...
                                                                                    </span>
                                                                                    <span v-else>
                                                                                        <i class="fas fa-check"></i> Confirm Booking
                                                                                    </span>
                                                                                </button>
                                                                                <button 
                                                                                    class="btn btn-secondary" 
                                                                                    @click="showBookingModal = false"
                                                                                    :disabled="loading"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <!-- Release Modal -->
                                                        <div v-if="showReleaseModal" class="modal-backdrop" @click="showReleaseModal = false">
                                                            <div class="modal-dialog" @click.stop>
                                                                <div class="modal-content">
                                                                    <div class="modal-header">
                                                                        <h5 class="modal-title">
                                                                            <i class="fas fa-sign-out-alt"></i> Release Parking Spot
                                                                        </h5>
                                                                        <button class="btn-close" @click="showReleaseModal = false"></button>
                                                                    </div>
                                                                    <div class="modal-body">
                                                                        <div v-if="selectedReservation">
                                                                            <h6>{{ selectedReservation.lot_name }}</h6>
                                                                            <p class="mb-2">Spot: <span class="badge bg-success">{{ selectedReservation.spot_number }}</span></p>
                                                                            <p class="mb-3">Duration: {{ calculateDuration(selectedReservation.parking_time) }}</p>

                                                                            <div class="alert alert-warning">
                                                                                <i class="fas fa-exclamation-triangle"></i>
                                                                                <small>You will be charged based on the parking duration.</small>
                                                                            </div>

                                                                            <div class="d-flex gap-2">
                                                                                <button 
                                                                                    class="btn btn-danger flex-grow-1" 
                                                                                    @click="releaseParkingSpot"
                                                                                    :disabled="loading"
                                                                                >
                                                                                    <span v-if="loading">
                                                                                        <i class="fas fa-spinner fa-spin"></i> Releasing...
                                                                                    </span>
                                                                                    <span v-else>
                                                                                        <i class="fas fa-check"></i> Confirm Release
                                                                                    </span>
                                                                                </button>
                                                                                <button 
                                                                                    class="btn btn-secondary" 
                                                                                    @click="showReleaseModal = false"
                                                                                    :disabled="loading"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            `
                                        }).mount('#app');
