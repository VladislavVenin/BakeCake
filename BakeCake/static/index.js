Vue.createApp({
    name: "App",
    components: {
        VForm: VeeValidate.Form,
        VField: VeeValidate.Field,
        ErrorMessage: VeeValidate.ErrorMessage,
    },
    data() {
        return {
            schema1: {
                lvls: (value) => {
                    if (value) {
                        return true;
                    }
                    return ' количество уровней';
                },
                form: (value) => {
                    if (value) {
                        return true;
                    }
                    return ' форму торта';
                },
                topping: (value) => {
                    if (value) {
                        return true;
                    }
                    return ' топпинг';
                }
            },
            schema2: {
                name: (value) => {
                    if (value) {
                        return true;
                    }
                    return ' имя';
                },
                phone: (value) => {
                    if (value) {
                        return true;
                    }
                    return ' телефон';
                },
                name_format: (value) => {
                    const regex = /^[a-zA-Zа-яА-Я]+$/
                    if (!value) {
                        return true;
                    }
                    if (!regex.test(value)) {
                        return '⚠ Формат имени нарушен';
                    }
                    return true;
                },
                email_format: (value) => {
                    const regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i
                    if (!value) {
                        return true;
                    }
                    if (!regex.test(value)) {
                        return '⚠ Формат почты нарушен';
                    }
                    return true;
                },
                phone_format: (value) => {
                    const regex = /^((8|\+7)[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}$/
                    if (!value) {
                        return true;
                    }
                    if (!regex.test(value)) {
                        return '⚠ Формат телефона нарушен';
                    }
                    return true;
                },
                email: (value) => {
                    if (value) {
                        return true;
                    }
                    return ' почту';
                },
                address: (value) => {
                    if (value) {
                        return true;
                    }
                    return ' адрес';
                },
                date: (value) => {
                    if (value) {
                        return true;
                    }
                    return ' дату доставки';
                },
                time: (value) => {
                    if (value) {
                        return true;
                    }
                    return ' время доставки';
                }
            },
            
            DATA: {
                Levels: [],
                Forms: [],
                Toppings: [],
                Berries: [],
                Decors: []
            },
            
            Costs: {
                Levels: [],
                Forms: [],
                Toppings: [],
                Berries: [],
                Decors: [],
                Words: 0
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

            PromoCode: '',
            PromoCodeApplied: false,
            PromoCodeDiscount: 0,
            PromoCodePercent: 0,
            FinalPrice: 0,
            CheckingPromo: false,
            PromoMessage: '',
            PromoError: '',
            
            isLoading: true,
            error: null
        }
    },
    
    mounted() {
        this.loadCakeData();
        this.checkAuthStatus();
        
        this.$watch('Berries', (newVal) => {
            console.log('=== Berries changed ===');
        });
        
        this.$watch('Levels', (newVal) => {
            console.log('=== Levels changed ===');
        });
    },
    
    methods: {
        async checkAuthStatus() {
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
                console.log('Пользователь не авторизован');
            }
        },
        
        async loadCakeData() {
            this.isLoading = true;
            this.error = null;
            
            try {
                const response = await fetch('/api/cake-data/');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Loaded API data:', data);
                
                if (data.layers && Array.isArray(data.layers)) {
                    this.levelsList = data.layers.map((layer, index) => ({
                        id: layer.quantity,
                        quantity: layer.quantity,
                        price: parseFloat(layer.price),
                        name: `${layer.quantity}`
                    }));
                }
                
                if (data.shapes && Array.isArray(data.shapes)) {
                    this.formsList = data.shapes.map(shape => ({
                        id: shape.id || shape.shape,
                        shape: shape.shape || shape.title,
                        price: parseFloat(shape.price),
                        name: shape.shape || shape.title
                    }));
                }
                
                if (data.toppings && Array.isArray(data.toppings)) {
                    this.toppingsList = data.toppings.map(topping => ({
                        id: topping.id,
                        title: topping.title || topping.name,
                        price: parseFloat(topping.price)
                    }));
                }
                
                if (data.berries && Array.isArray(data.berries)) {
                    this.berriesList = data.berries.map(berry => ({
                        id: berry.id,
                        title: berry.title || berry.name,
                        price: parseFloat(berry.price)
                    }));
                }
                
                if (data.decors && Array.isArray(data.decors)) {
                    this.decorsList = data.decors.map(decor => ({
                        id: decor.id,
                        title: decor.title || decor.name,
                        price: parseFloat(decor.price)
                    }));
                }
                
                this.DATA.Levels = this.levelsList.map(l => l.name);
                this.DATA.Forms = this.formsList.map(f => f.shape);
                this.DATA.Toppings = this.toppingsList.map(t => t.title);
                this.DATA.Berries = this.berriesList.map(b => b.title);
                this.DATA.Decors = this.decorsList.map(d => d.title);
                
                this.berriesData = {};
                this.berriesList.forEach(berry => {
                    this.berriesData[berry.id] = berry.price;
                });
                
                this.toppingsData = {};
                this.toppingsList.forEach(topping => {
                    this.toppingsData[topping.id] = topping.price;
                });
                
                this.decorsData = {};
                this.decorsList.forEach(decor => {
                    this.decorsData[decor.id] = decor.price;
                });
                
                this.levelsData = {};
                this.levelsList.forEach(level => {
                    this.levelsData[level.id] = level.price;
                });
                
                this.formsData = {};
                this.formsList.forEach(form => {
                    this.formsData[form.id] = form.price;
                });
                
                this.Costs.Words = parseFloat(data.words_price) || 500;
                
                console.log('Processed levelsList:', this.levelsList);
                console.log('Processed berriesList:', this.berriesList);
                
            } catch (error) {
                console.error('Error loading cake data:', error);
                this.error = 'Не удалось загрузить данные';
            } finally {
                this.isLoading = false;
            }
        },

        async applyPromoCode() {
            if (!this.PromoCode) {
                this.PromoError = 'Введите промокод';
                return;
            }

            this.CheckingPromo = true;
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
                        code: this.PromoCode,
                        total_price: this.Cost
                    })
                });
                
                const data = await response.json();

                if (response.ok && data.valid) {
                    this.PromoCodeApplied = true;
                    this.PromoCodeDiscount = data.discount_amount;
                    this.PromoCodePercent = data.discount_percent;
                    this.FinalPrice = data.final_price;
                    this.PromoMessage = data.message;

                    this.$refs.HiddenFormSubmit?.form?.querySelector('[name="PROMO_CODE"]')?.remove();
                    const promoInput = document.createElement('input');
                    promoInput.type = 'hidden';
                    promoInput.name = 'PROMO_CODE';
                    promoInput.value = this.PromoCode;
                    this.$refs.HiddenFormSubmit?.appendChild(promoInput);
                } else {
                    this.PromoError = data.error || 'Не удалось применить промокод';
                }
            } catch (error) {
                console.error('Ошибка проверки промокода:', error);
                this.PromoError = 'Ошибка соединения с сервером';
            } finally {
                this.CheckingPromo = false;
            }
        },
        
        removePromoCode() {
            this.PromoCodeApplied = false;
            this.PromoCodeDiscount = 0;
            this.PromoCodePercent = 0;
            this.PromoCode = '';
            this.PromoMessage = '';
            this.PromoError = '';

            const promoInput = this.$refs.HiddenFormSubmit?.querySelector('[name="PROMO_CODE"]');
            if (promoInput) promoInput.remove();
        },

        getBerryPrice() {
            if (!this.Berries) return 0;
            return this.berriesData[this.Berries] || 0;
        },

        getToppingPrice() {
            if (!this.Topping) return 0;
            return this.toppingsData[this.Topping] || 0;
        },
        
        getDecorPrice() {
            if (!this.Decor) return 0;
            return this.decorsData[this.Decor] || 0;
        },
        
        getLevelPrice() {
            if (!this.Levels) return 0;
            return this.levelsData[this.Levels] || 0;
        },
        
        getFormPrice() {
            if (!this.Form) return 0;
            return this.formsData[this.Form] || 0;
        },
        
        ToStep4() {
            this.Designed = true
            setTimeout(() => this.$refs.ToStep4.click(), 0);
        },
        
        resetSelections() {
            this.Berries = null;
            this.Topping = null;
            this.Decor = null;
            this.Levels = null;
            this.Form = null;
            this.Words = '';
        },
        submitOrder() {
            if (this.$refs.HiddenForm) {
                const form = this.$refs.HiddenForm;
                form.querySelector('[name="LEVELS"]').value = this.Levels || '';
                form.querySelector('[name="FORM"]').value = this.Form || '';
                form.querySelector('[name="TOPPING"]').value = this.Topping || '';
                form.querySelector('[name="BERRIES"]').value = this.Berries || '';
                form.querySelector('[name="DECOR"]').value = this.Decor || '';
                form.querySelector('[name="WORDS"]').value = this.Words || '';
                form.querySelector('[name="COMMENTS"]').value = this.Comments || '';
                form.querySelector('[name="NAME"]').value = this.Name || '';
                form.querySelector('[name="PHONE"]').value = this.Phone || '';
                form.querySelector('[name="EMAIL"]').value = this.Email || '';
                form.querySelector('[name="ADDRESS"]').value = this.Address || '';
                form.querySelector('[name="DATE"]').value = this.Dates || '';
                form.querySelector('[name="TIME"]').value = this.Time || '';
                form.querySelector('[name="DELIVCOMMENTS"]').value = this.DelivComments || '';
                form.querySelector('[name="PROMO_CODE"]').value = this.AppliedPromoCode || '';
                
                form.submit();
            }
        },
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
            const cost = this.Cost;
            if (isNaN(cost)) return '0';
            return Math.round(cost).toLocaleString('ru-RU');
        },
        
        selectedLevelName() {
            if (!this.Levels) return 'не выбрано';
            if (!this.levelsList || this.levelsList.length === 0) return 'не выбрано';
            
            const level = this.levelsList.find(l => l.id == this.Levels);
            if (!level) return 'не выбрано';
            return level.name || `${level.quantity}`;
        },
        
        selectedFormName() {
            if (!this.Form) return 'не выбрано';
            if (!this.formsList || this.formsList.length === 0) return 'не выбрано';
            
            const form = this.formsList.find(f => f.id == this.Form);
            if (!form) return 'не выбрано';
            return form.shape || form.name;
        },
        
        selectedToppingName() {
            if (!this.Topping) return 'не выбрано';
            if (!this.toppingsList || this.toppingsList.length === 0) return 'не выбрано';
            
            const topping = this.toppingsList.find(t => t.id == this.Topping);
            if (!topping) return 'не выбрано';
            return topping.title;
        },
        
        selectedBerryName() {
            if (!this.Berries) return 'нет';
            if (!this.berriesList || this.berriesList.length === 0) return 'нет';
            
            const berry = this.berriesList.find(b => b.id == this.Berries);
            if (!berry) return 'нет';
            return berry.title;
        },
        
        selectedDecorName() {
            if (!this.Decor) return 'нет';
            if (!this.decorsList || this.decorsList.length === 0) return 'нет';
            
            const decor = this.decorsList.find(d => d.id == this.Decor);
            if (!decor) return 'нет';
            return decor.title;
        }
    },
    
    watch: {
        Berries(newVal) {
            console.log('Berry selected ID:', newVal);
            console.log('Berry name:', this.selectedBerryName);
            console.log('Berry price:', this.getBerryPrice());
        },
        Levels(newVal) {
            console.log('Level selected ID:', newVal);
            console.log('Level name:', this.selectedLevelName);
            console.log('Level price:', this.getLevelPrice());
        },
        Form(newVal) {
            console.log('Form selected ID:', newVal);
            console.log('Form name:', this.selectedFormName);
            console.log('Form price:', this.getFormPrice());
        },
        Topping(newVal) {
            console.log('Topping selected ID:', newVal);
            console.log('Topping name:', this.selectedToppingName);
            console.log('Topping price:', this.getToppingPrice());
        },
        Decor(newVal) {
            console.log('Decor selected ID:', newVal);
            console.log('Decor name:', this.selectedDecorName);
            console.log('Decor price:', this.getDecorPrice());
        }
    }
}).mount('#VueApp');