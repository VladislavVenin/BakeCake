Vue.createApp({
    components: {
        VForm: VeeValidate.Form,
        VField: VeeValidate.Field,
        ErrorMessage: VeeValidate.ErrorMessage,
    },
    data() {
        return {
            RegSchema: {
                reg: (value) => {
                    if (value && value.includes('@')) {
                        return true;
                    }
                    return 'Введите корректный email';
                }
            },
            RegInput: '',
            loading: false,
            error: ''
        }
    },
    methods: {
        async RegSubmit() {
            if (!this.RegInput || !this.RegInput.includes('@')) {
                this.error = 'Введите корректный email';
                return;
            }
            
            this.loading = true;
            this.error = '';
            
            try {
                const csrftoken = this.getCookie('csrftoken');
                
                const response = await fetch('/accounts/api/auth/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify({
                        email: this.RegInput
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    this.RegInput = 'Регистрация успешна';
                    setTimeout(() => {
                        window.location.href = '/lk/';
                    }, 1500);
                } else {
                    this.error = data.error || 'Ошибка входа';
                    this.RegInput = '';
                }
            } catch (error) {
                console.error('Ошибка:', error);
                this.error = 'Ошибка соединения с сервером';
            } finally {
                this.loading = false;
            }
        },
        
        Reset() {
            this.RegInput = '';
            this.error = '';
            this.loading = false;
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
    }
}).mount('#RegModal');