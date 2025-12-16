// Advanced Form Validation with Real-time Feedback
function initAdvancedFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            // Real-time validation
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                if (this.classList.contains('error')) {
                    validateField(this);
                }
            });
        });
        
        // Form submission validation
        form.addEventListener('submit', function(e) {
            let isValid = true;
            
            inputs.forEach(input => {
                if (!validateField(input)) {
                    isValid = false;
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                
                // Focus first error field
                const firstError = form.querySelector('.error');
                if (firstError) {
                    firstError.focus();
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    });
}

function validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    const required = field.hasAttribute('required');
    let isValid = true;
    let errorMessage = '';
    
    // Remove previous error state
    field.classList.remove('error', 'success');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    // Required field validation
    if (required && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    }
    
    // Email validation
    if (type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
    }
    
    // Phone validation (basic)
    if (type === 'tel' && value) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number';
        }
    }
    
    // Textarea length validation
    if (field.tagName === 'TEXTAREA' && value) {
        const minLength = field.getAttribute('minlength');
        if (minLength && value.length < parseInt(minLength)) {
            isValid = false;
            errorMessage = `Please enter at least ${minLength} characters`;
        }
    }
    
    // File validation
    if (type === 'file' && field.files.length > 0) {
        const file = field.files[0];
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = field.getAttribute('accept');
        
        if (file.size > maxSize) {
            isValid = false;
            errorMessage = 'File size must be less than 10MB';
        }
        
        if (allowedTypes && !isFileTypeAllowed(file.name, allowedTypes)) {
            isValid = false;
            errorMessage = 'File type not allowed';
        }
    }
    
    // Update UI
    if (isValid && value) {
        field.classList.add('success');
    } else if (!isValid) {
        field.classList.add('error');
        showFieldError(field, errorMessage);
    }
    
    return isValid;
}

function showFieldError(field, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        color: var(--accent-orange);
        font-size: 0.85rem;
        margin-top: 0.5rem;
        animation: slideInDown 0.3s ease;
    `;
    
    field.parentNode.appendChild(errorDiv);
}

function isFileTypeAllowed(filename, allowedTypes) {
    const extension = filename.split('.').pop().toLowerCase();
    const types = allowedTypes.split(',').map(t => t.trim().replace('.', ''));
    return types.includes(extension);
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdvancedFormValidation);
} else {
    initAdvancedFormValidation();
}

