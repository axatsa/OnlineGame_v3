import { Navigation } from "../components/Navigation";
import { Sparkles, BookOpen, Gamepad2, ScrollText } from "lucide-react";
import { Link } from "react-router";

export function LandingPage() {
  const features = [
    {
      icon: <Gamepad2 className="w-12 h-12" />,
      title: "Interactive Games",
      description: "Create engaging educational games that make learning fun and memorable for your students.",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-500",
    },
    {
      icon: <ScrollText className="w-12 h-12" />,
      title: "Smart Quizzes",
      description: "Generate adaptive quizzes that challenge students at their level and track progress.",
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-500",
    },
    {
      icon: <BookOpen className="w-12 h-12" />,
      title: "Digital Books",
      description: "Build interactive digital books with rich multimedia content and engaging narratives.",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-purple-50 rounded-full mb-8">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <span className="text-purple-700">AI-Powered Lesson Creation</span>
          </div>
          
          <h1 className="text-7xl mb-6 font-serif">
            Revolutionize Your Classroom
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Create magical learning experiences in seconds. Generate interactive games, 
            quizzes, and digital books powered by AI.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/generator"
              className="px-10 py-5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all shadow-xl hover:shadow-2xl hover:scale-105 inline-flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Start Creating
            </Link>
            <Link
              to="/dashboard"
              className="px-10 py-5 bg-white text-gray-700 rounded-full hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2 border border-gray-200"
            >
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl mb-4 font-serif">Everything You Need</h2>
            <p className="text-xl text-gray-600">
              Powerful tools designed for modern educators
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`${feature.bgColor} p-10 rounded-[24px] hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-2xl`}
              >
                <div className={`${feature.iconColor} mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-16 rounded-[32px] text-center text-white shadow-2xl">
            <h2 className="text-5xl mb-6 font-serif">Ready to Transform Your Teaching?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of teachers creating magical learning experiences
            </p>
            <Link
              to="/generator"
              className="inline-block px-10 py-5 bg-white text-blue-600 rounded-full hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Get Started for Free
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
