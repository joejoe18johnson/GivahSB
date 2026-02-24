"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would submit to a backend API
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Mail className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-medium mb-6">
              Contact Us
            </h1>
            <p className="text-xl md:text-2xl text-primary-100">
              We&apos;re here to help. Get in touch with any questions or concerns.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <h2 className="text-3xl font-medium mb-6">Send Us a Message</h2>
                {submitted ? (
                  <div className="bg-success-50 border border-success-200 rounded-lg p-8 text-center">
                    <CheckCircle2 className="w-16 h-16 text-success-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-medium text-success-900 mb-2">Thank You!</h3>
                    <p className="text-success-800">
                      Your message has been sent. We&apos;ll get back to you as soon as possible.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Subject *
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select a subject</option>
                        <option value="campaign">Campaign Question</option>
                        <option value="verification">Verification Help</option>
                        <option value="payout">Payout Question</option>
                        <option value="technical">Technical Support</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Message *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Tell us how we can help..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-success-500 text-white px-8 py-4 rounded-full font-medium hover:bg-success-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      Send Message
                    </button>
                  </form>
                )}
              </div>

              {/* Contact Information */}
              <div>
                <h2 className="text-3xl font-medium mb-6">Get in Touch</h2>
                <div className="space-y-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Email</h3>
                      <a
                        href="mailto:info@belizefund.bz"
                        className="text-primary-600 hover:text-primary-700"
                      >
                        info@belizefund.bz
                      </a>
                      <br />
                      <a
                        href="mailto:support@belizefund.bz"
                        className="text-primary-600 hover:text-primary-700"
                      >
                        support@belizefund.bz
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Phone</h3>
                      <p className="text-gray-700">
                        +501 XXX-XXXX
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Monday - Friday, 9:00 AM - 5:00 PM BZT
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">Address</h3>
                      <p className="text-gray-700">
                        GivahBz<br />
                        Belize City, Belize<br />
                        Central America
                      </p>
                    </div>
                  </div>
                </div>

                {/* FAQ Link */}
                <div className="bg-white rounded-lg p-6">
                  <h3 className="font-medium text-gray-900 mb-2">Before You Contact Us</h3>
                  <p className="text-gray-700 text-sm mb-4">
                    Many common questions are answered in our FAQ section. Check there first for quick answers.
                  </p>
                  <a
                    href="/faq"
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    Visit FAQ Page →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
