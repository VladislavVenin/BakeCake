const app = Vue.createApp({
    data() {
        return {
            schema1: {
                lvls: (value) => {
                    if (value) return true;
                    return ' количество уровней';
                },
                form: (value) => {
                    if (value) return true;
                    return ' форму торта';
                },
                topping: (value) => {
                    if (value) return true;
                    return ' топпинг';
                }
            },
            schema2: {
                name: (value) => {
                    if (value) return true;
                    return ' имя';
                },
                phone: (value) => {
                    if (value) return true;
                    return ' телефон';
                },
                name_format: (value) => {
                    const regex = /^[a-zA-Zа-яА-Я]+$/;
                    if (!value) return true;
                    if (!regex.test(value)) return '⚠ Формат имени нарушен';
                    return true;
                },
                email_format: (value) => {
                    const regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
                    if (!value) return true;
                    if (!regex.test(value)) return '⚠ Формат почты нарушен';
                    return true;
                },
                phone_format: (value) => {
                    const regex = /^((8|\+7)[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}$/;
                    if (!value) return true;
                    if (!regex.test(value)) return '⚠ Формат телефона нарушен';
                    return true;
                },
                email: (value) => {
                    if (value) return true;
                    return ' почту';
                },
                address: (value) => {
                    if (value) return true;
                    return ' адрес';
                },
                date: (value) => {
                    if (!value) return ' дату доставки';
                    // Проверка, что дата не прошедшая
                    const selectedDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (selectedDate < today) {
                        return '⚠ Нельзя выбрать прошедшую дату';
                    }
                    return true;
                },
                time: (value) => {
                    if (!value) return ' время доставки';
                    
                    if (this.Dates) {
                        const selectedDate = new Date(this.Dates);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        
                        if (selectedDate.getTime() === today.getTime()) {
                            const [hours, minutes] = value.split(':');
                            const selectedTime = new Date();
                            selectedTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                            const now = new Date();
                            
                            if (selectedTime <= now) {
                                return '⚠ Время доставки уже прошло';
                            }
                        }
                    }
                    return true;
                }
            },
            
            levelsList: [],
            formsList: [],
            toppingsList: [],
            berriesList: [],
            decorsList: [],
            
            berriesData: {},
            toppingsData: {},
            decorsData: {},
            levelsData: {},
            formsData: {},
            
            Berries: null,
            Topping: null,
            Decor: null,
            Levels: null,
            Form: null,
            
            Words: '',
            Comments: '',
            Designed: false,

            Name: '',
            Phone: null,
            Email: null,
            Address: null,
            Dates: null,
            Time: null,
            DelivComments: '',

            PromoCodeInput: '',
            AppliedPromoCode: '',
            promoApplied: false,
            checkingPromo: false,
            PromoMessage: '',
            PromoError: '',
            finalPrice: 0,

            isLoading: true,
            error: null,
            
            minDate: ''
        };
    },
    
    mounted() {
        console.log('Vue mounted');
        this.loadCakeData();
        this.checkAuth();
        
        const today = new Date();
        this.minDate = today.toISOString().split('T')[0];
        
        this.$watch('Cost', (newVal) => {
            this.finalPrice = newVal;
            if (this.promoApplied && this.AppliedPromoCode) {
                this.applyPromoCode();
            }
        });
        
        this.$watch('Dates', () => {
            if (this.Time) {
                this.$nextTick(() => {
                    const timeField = document.querySelector('[name="time_format"]');
                    if (timeField && timeField.dispatchEvent) {
                        timeField.dispatchEvent(new Event('input'));
                    }
                });
            }
        });
    },
    
    methods: {
        async checkAuth() {
            try {
                const response = await fetch('/accounts/api/profile/');
                if (response.ok) {
                    const data = await response.json();
                    const loginBtn = document.getElementById('loginBtn');
                    const profileLink = document.getElementById('profileLink');
                    
                    if (loginBtn && profileLink) {
                        loginBtn.style.display = 'none';
                        profileLink.style.display = 'block';
                        profileLink.textContent = data.fio || data.email || 'Профиль';
                    }
                }
            } catch (error) {
                console.log('Auth check failed');
            }
        },
        
        async loadCakeData() {
            try {
                const response = await fetch('/api/cake-data/');
                const data = await response.json();
                
                if (data.layers) {
                    this.levelsList = data.layers.map(l => ({
                        id: l.quantity,
                        price: parseFloat(l.price),
                        name: `${l.quantity}`
                    }));
                    this.levelsData = {};
                    this.levelsList.forEach(l => { this.levelsData[l.id] = l.price; });
                }
                
                if (data.shapes) {
                    this.formsList = data.shapes.map(s => ({
                        id: s.id,
                        shape: s.shape,
                        price: parseFloat(s.price)
                    }));
                    this.formsData = {};
                    this.formsList.forEach(f => { this.formsData[f.id] = f.price; });
                }
                
                if (data.toppings) {
                    this.toppingsList = data.toppings.map(t => ({
                        id: t.id,
                        title: t.title,
                        price: parseFloat(t.price)
                    }));
                    this.toppingsData = {};
                    this.toppingsList.forEach(t => { this.toppingsData[t.id] = t.price; });
                }
                
                if (data.berries) {
                    this.berriesList = data.berries.map(b => ({
                        id: b.id,
                        title: b.title,
                        price: parseFloat(b.price)
                    }));
                    this.berriesData = {};
                    this.berriesList.forEach(b => { this.berriesData[b.id] = b.price; });
                }
                
                if (data.decors) {
                    this.decorsList = data.decors.map(d => ({
                        id: d.id,
                        title: d.title,
                        price: parseFloat(d.price)
                    }));
                    this.decorsData = {};
                    this.decorsList.forEach(d => { this.decorsData[d.id] = d.price; });
                }
                
                this.isLoading = false;
            } catch (error) {
                console.error('Error loading data:', error);
                this.error = 'Ошибка загрузки';
                this.isLoading = false;
            }
        },
        
        getLevelPrice() {
            return this.Levels ? (this.levelsData[this.Levels] || 0) : 0;
        },
        
        getFormPrice() {
            return this.Form ? (this.formsData[this.Form] || 0) : 0;
        },
        
        getToppingPrice() {
            return this.Topping ? (this.toppingsData[this.Topping] || 0) : 0;
        },
        
        getBerryPrice() {
            return this.Berries ? (this.berriesData[this.Berries] || 0) : 0;
        },
        
        getDecorPrice() {
            return this.Decor ? (this.decorsData[this.Decor] || 0) : 0;
        },
        
        ToStep4() {
            this.Designed = true;
            setTimeout(() => {
                const link = this.$refs.ToStep4;
                if (link) link.click();
            }, 0);
        },
        
        async applyPromoCode() {
            if (!this.PromoCodeInput) {
                this.PromoError = 'Введите промокод';
                return;
            }

            this.checkingPromo = true;
            this.PromoError = '';
            this.PromoMessage = '';

            try {
                const response = await fetch('/api/check-promo/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': this.getCookie('csrftoken')
                    },
                    body: JSON.stringify({
                        code: this.PromoCodeInput,
                        total_price: this.Cost
                    })
                });
                
                const data = await response.json();

                if (response.ok && data.valid) {
                    this.promoApplied = true;
                    this.AppliedPromoCode = this.PromoCodeInput;
                    this.PromoCodeDiscount = data.discount_amount;
                    this.PromoCodePercent = data.discount_percent;
                    this.finalPrice = data.final_price;
                    this.PromoMessage = data.message;
                    this.PromoError = '';
                } else {
                    this.PromoError = data.error || 'Не удалось применить промокод';
                    this.promoApplied = false;
                    this.AppliedPromoCode = '';
                    this.PromoCodeDiscount = 0;
                    this.finalPrice = this.Cost;
                }
            } catch (error) {
                console.error('Ошибка проверки промокода:', error);
                this.PromoError = 'Ошибка соединения с сервером';
            } finally {
                this.checkingPromo = false;
            }
        },
        
        removePromoCode() {
            this.promoApplied = false;
            this.AppliedPromoCode = '';
            this.PromoCodeInput = '';
            this.PromoCodeDiscount = 0;
            this.PromoCodePercent = 0;
            this.PromoMessage = '';
            this.PromoError = '';
            this.finalPrice = this.Cost;
        },
        
        submitOrder() {
            console.log('submitOrder called');
            
            if (this.Dates && this.Time) {
                const selectedDateTime = new Date(`${this.Dates}T${this.Time}`);
                const now = new Date();
                
                if (selectedDateTime <= now) {
                    alert('Нельзя выбрать прошедшие дату и время доставки');
                    return;
                }
            } else {
                alert('Заполните дату и время доставки');
                return;
            }
            
            if (!this.Name || !this.Phone || !this.Email || !this.Address) {
                alert('Заполните все поля: Имя, Телефон, Почта, Адрес');
                return;
            }
            
            const form = this.$refs.HiddenForm;
            if (form) {
                const fields = {
                    'LEVELS': this.Levels,
                    'FORM': this.Form,
                    'TOPPING': this.Topping,
                    'BERRIES': this.Berries,
                    'DECOR': this.Decor,
                    'WORDS': this.Words,
                    'COMMENTS': this.Comments,
                    'NAME': this.Name,
                    'PHONE': this.Phone,
                    'EMAIL': this.Email,
                    'ADDRESS': this.Address,
                    'DATE': this.Dates,
                    'TIME': this.Time,
                    'DELIVCOMMENTS': this.DelivComments,
                    'PROMO_CODE': this.AppliedPromoCode
                };
                
                for (const [name, value] of Object.entries(fields)) {
                    const input = form.querySelector(`[name="${name}"]`);
                    if (input) input.value = value || '';
                }
                
                form.submit();
            }
        },
        
        getCookie(name) {
            let cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        }
    },
    
    computed: {
        Cost() {
            if (this.isLoading) return 0;
            const total = this.getLevelPrice() + 
                         this.getFormPrice() + 
                         this.getToppingPrice() + 
                         this.getBerryPrice() + 
                         this.getDecorPrice() + 
                         (this.Words && this.Words.trim() !== '' ? 500 : 0);
            return total;
        },
        
        FormattedCost() {
            return Math.round(this.Cost).toLocaleString('ru-RU');
        },
        
        selectedLevelName() {
            if (!this.Levels) return 'не выбрано';
            const level = this.levelsList.find(l => l.id == this.Levels);
            return level ? level.name : 'не выбрано';
        },
        
        selectedFormName() {
            if (!this.Form) return 'не выбрано';
            const form = this.formsList.find(f => f.id == this.Form);
            return form ? form.shape : 'не выбрано';
        },
        
        selectedToppingName() {
            if (!this.Topping) return 'не выбрано';
            const topping = this.toppingsList.find(t => t.id == this.Topping);
            return topping ? topping.title : 'не выбрано';
        },
        
        selectedBerryName() {
            if (!this.Berries) return 'нет';
            const berry = this.berriesList.find(b => b.id == this.Berries);
            return berry ? berry.title : 'нет';
        },
        
        selectedDecorName() {
            if (!this.Decor) return 'нет';
            const decor = this.decorsList.find(d => d.id == this.Decor);
            return decor ? decor.title : 'нет';
        },
        
        isUrgent() {
            if (!this.Dates || !this.Time) return false;
            try {
                const deliveryDateTime = new Date(`${this.Dates}T${this.Time}`);
                const now = new Date();
                const hoursDiff = (deliveryDateTime - now) / (1000 * 60 * 60);
                return hoursDiff > 0 && hoursDiff < 24;
            } catch (e) {
                return false;
            }
        }
    }
});

app.component('VForm', VeeValidate.Form);
app.component('VField', VeeValidate.Field);
app.component('ErrorMessage', VeeValidate.ErrorMessage);

app.mount('#VueApp');