// 1. SEGURANÇA
window.addEventListener('pageshow', function(event) {
    if (event.persisted || (window.performance && window.performance.navigation.type === 2)) {
        window.location.reload();
    }
});

(function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.replace('/');
    }
})();

// 2. LÓGICA DO STEPPER
document.addEventListener('DOMContentLoaded', () => {
    
    const steps = document.querySelectorAll('.step-circle');
    const descriptions = document.querySelectorAll('.description');
    const btnNext = document.getElementById('btn-next');
    const btnPrev = document.getElementById('btn-prev');
    const btnContinue = document.getElementById('btn-continue');
    
    let currentStep = 0; 
    const maxSteps = steps.length - 1;

    // Atualiza a UI (Bolinhas, Texto e Setas)
    function updateUI() {
        // Atualiza Bolinhas
        steps.forEach((step, index) => {
            if (index === currentStep) {
                step.classList.remove('step-inactive');
                step.classList.add('step-active');
            } else {
                step.classList.remove('step-active');
                step.classList.add('step-inactive');
            }
        });

        // Atualiza Texto (Descrição)
        descriptions.forEach((desc, index) => {
            if (index === currentStep) {
                desc.classList.add('active');
            } else {
                desc.classList.remove('active');
            }
        });

        // Atualiza estado das setas (Habilita/Desabilita visualmente)
        if (currentStep === 0) {
            btnPrev.classList.add('disabled');
        } else {
            btnPrev.classList.remove('disabled');
        }

        // Se estiver no último passo, o botão muda de texto (Opcional)
        /* if (currentStep === maxSteps) {
            btnContinue.textContent = "Começar";
        } else {
            btnContinue.textContent = "Continuar";
        } */
    }

    // Navegar para um passo específico
    function goToStep(index) {
        if (index >= 0 && index <= maxSteps) {
            currentStep = index;
            updateUI();
        }
    }

    // Avançar
    function goNext() {
        if (currentStep < maxSteps) {
            goToStep(currentStep + 1);
        } else {
            // Fim do Wizard -> Vai para o Dashboard
            window.location.href = '/financeiro'; 
        }
    }

    // Voltar
    function goPrev() {
        if (currentStep > 0) {
            goToStep(currentStep - 1);
        }
    }

    // --- EVENT LISTENERS ---

    // Botões de Seta e Continuar
    if(btnNext) btnNext.addEventListener('click', goNext);
    if(btnPrev) btnPrev.addEventListener('click', goPrev);
    if(btnContinue) btnContinue.addEventListener('click', goNext);

    // Clique direto nas bolinhas
    steps.forEach((step) => {
        step.addEventListener('click', () => {
            const index = parseInt(step.getAttribute('data-step'));
            goToStep(index);
        });
    });

    // Inicializa o estado correto
    updateUI();
});