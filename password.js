document.addEventListener("DOMContentLoaded", function() {
    const passwordInput = document.getElementById("password");
    const toggleIcon = document.querySelector(".password-toggle-icon i");

    toggleIcon.addEventListener("click", function() {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            toggleIcon.classList.remove("fa-eye");
            toggleIcon.classList.add("fa-eye-slash");
        } else {
            passwordInput.type = "password";
            toggleIcon.classList.remove("fa-eye-slash");
            toggleIcon.classList.add("fa-eye");
        }
    });
});