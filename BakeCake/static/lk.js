Vue.createApp({
    components: {
        VForm: VeeValidate.Form,
        VField: VeeValidate.Field,
        ErrorMessage: VeeValidate.ErrorMessage,
    },
    data() {
        return {
            Edit: false,
            Name: '',
            Phone: '',
            Email: '',
            Address: '',
            Orders: [],
            loading: true,
            Schema: {
                name_format: (value) => {
                    const regex = /^[a-zA-Zа-яА-Я\s]+$/
                    if (!value) {
                        return '⚠ Поле не может быть пустым';
                    }
                    if (!regex.test(value)) {
                        return '⚠ Недопустимые символы в имени';
                    }
                    return true;
                },
                phone_format: (value) => {
                    const regex = /^((8|\+7)[\- ]?)?(\(?\d{3}\)?[\- ]?)?[\d\- ]{7,10}$/
                    if (!value) {
                        return '⚠ Поле не может быть пустым';
                    }
                    if (!regex.test(value)) {
                        return '⚠ Формат телефона нарушен';
                    }
                    return true;
                },
                email_format: (value) => {
                    const regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i
                    if (!value) {
                        return '⚠ Поле не может быть пустым';
                    }
                    if (!regex.test(value)) {
                        return '⚠ Формат почты нарушен';
                    }
                    return true;
                },
                address_format: (value) => {
                    if (!value) {
                        return '⚠ Поле не может быть пустым';
                    }
                    if (value.length < 5) {
                        return '⚠ Введите полный адрес';
                    }
                    return true;
                }
            }
        }
    },
    
    mounted() {
        this.loadProfile();
        this.loadOrders();
    },
    
    methods: {
        async loadProfile() {
            try {
                const response = await fetch('/accounts/api/profile/', {
                    headers: {
                        'X-CSRFToken': this.getCookie('csrftoken')
                    }
                });
                
                if (response.status === 401) {
                    window.location.href = '/';
                    return;
                }
                
                if (response.ok) {
                    const data = await response.json();
                    this.Name = data.fio || '';
                    this.Phone = data.phone || '';
                    this.Email = data.email || '';
                    this.Address = data.address || '';
                }
            } catch (error) {
                console.error('Ошибка загрузки профиля:', error);
            }
        },
        
        async loadOrders() {
            try {
                const response = await fetch('/accounts/api/orders/', {
                    headers: {
                        'X-CSRFToken': this.getCookie('csrftoken')
                    }
                });
                
                if (response.ok) {
                    this.Orders = await response.json();
                    console.log('Заказы загружены:', this.Orders);
                }
            } catch (error) {
                console.error('Ошибка загрузки заказов:', error);
            } finally {
                this.loading = false;
            }
        },
        
        async ApplyChanges() {
            try {
                const response = await fetch('/accounts/api/profile/update/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': this.getCookie('csrftoken')
                    },
                    body: JSON.stringify({
                        fio: this.Name,
                        phone: this.Phone,
                        address: this.Address
                    })
                });
                
                if (response.ok) {
                    this.Edit = false;
                    await this.loadProfile();
                } else {
                    const error = await response.json();
                    console.error('Ошибка обновления:', error);
                }
            } catch (error) {
                console.error('Ошибка при сохранении:', error);
            }
        },
        
        async logout() {
            try {
                const response = await fetch('/accounts/api/logout/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': this.getCookie('csrftoken')
                    }
                });
                
                if (response.ok) {
                    window.location.href = '/';
                }
            } catch (error) {
                console.error('Ошибка выхода:', error);
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
        },

        declension(count) {
            const titles = ['торт', 'торта', 'тортов'];
            const cases = [2, 0, 1, 1, 1, 2];
            return titles[(count % 100 > 4 && count % 100 < 20) ? 2 : cases[(count % 10 < 5) ? count % 10 : 5]];
        },
    }
}).mount('#LK');