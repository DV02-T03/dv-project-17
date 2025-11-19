// animations.js - Additional animation effects
document.addEventListener('DOMContentLoaded', function() {
    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Animate chart bars
                if (entry.target.classList.contains('chart-bars')) {
                    const bars = entry.target.querySelectorAll('.bar');
                    bars.forEach((bar, index) => {
                        setTimeout(() => {
                            bar.style.height = bar.style.height;
                        }, index * 200);
                    });
                }
            }
        });
    }, observerOptions);

    // Elements to animate on scroll
    const elementsToAnimate = document.querySelectorAll('.question-card, .stat-card, .preview-content, .chart-bars');
    elementsToAnimate.forEach(el => {
        observer.observe(el);
    });

    // Add animation class to elements
    const style = document.createElement('style');
    style.textContent = `
        .question-card, .stat-card, .preview-content, .chart-bars {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        .question-card:nth-child(1) { transition-delay: 0.1s; }
        .question-card:nth-child(2) { transition-delay: 0.2s; }
        .question-card:nth-child(3) { transition-delay: 0.3s; }
        .question-card:nth-child(4) { transition-delay: 0.4s; }
        .question-card:nth-child(5) { transition-delay: 0.5s; }
        
        .stat-card:nth-child(1) { transition-delay: 0.1s; }
        .stat-card:nth-child(2) { transition-delay: 0.2s; }
        .stat-card:nth-child(3) { transition-delay: 0.3s; }
        
        .bar {
            height: 0 !important;
            transition: height 1s ease;
        }
    `;
    document.head.appendChild(style);

    // Video fallback if video doesn't load
    const video = document.getElementById('traffic-video');
    if (video) {
        video.addEventListener('error', function() {
            // If video fails to load, use a background image instead
            document.querySelector('.video-container').innerHTML = `
                <div class="video-fallback" style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(rgba(10, 41, 64, 0.85), rgba(10, 41, 64, 0.9)),
                                url('assets/traffic-bg.jpg') center/cover no-repeat;
                    z-index: -2;
                "></div>
                <div class="video-overlay"></div>
            `;
        });
    }
});