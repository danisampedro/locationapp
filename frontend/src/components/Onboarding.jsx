import { useState } from 'react'

export default function Onboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: "Discover Amazing tourist centres",
      description: "Experience the thrill of navigating the ever-evolving tourist centers where you get to see amazing places and create unforgettable memories.",
      backgroundImage: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80"
    }
  ]

  const handleGetStarted = () => {
    if (onComplete) {
      onComplete()
    }
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${steps[currentStep].backgroundImage})`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-dark-blue via-dark-blue/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end pb-12 px-6">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold text-white mb-4">
            {steps[currentStep].title}
          </h1>
          <p className="text-white/90 text-lg mb-8 leading-relaxed">
            {steps[currentStep].description}
          </p>

          {/* Progress Dots */}
          <div className="flex gap-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep ? 'w-8 bg-white' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* Get Started Button */}
          <button
            onClick={handleGetStarted}
            className="w-full bg-dark-blue text-white py-4 rounded-xl font-semibold text-lg hover:bg-dark-blue-light transition-colors shadow-lg"
          >
            Get started
          </button>
        </div>
      </div>
    </div>
  )
}

