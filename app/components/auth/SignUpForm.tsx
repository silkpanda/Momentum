// =========================================================
// silkpanda/momentum-web/components/auth/SignUpForm.tsx
// Parent Sign-Up Form Component (Phase 2.1)
// =========================================================
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, AlertTriangle, Loader, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation'; // For redirection after success

// Interface for the form state
interface FormState {
    firstName: string;
    email: string;
    password: string;
}

const SignUpForm: React.FC = () => {
    const [formData, setFormData] = useState<FormState>({
        firstName: '',
        email: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError(null); // Clear error on new input
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        // Basic client-side validation
        if (!formData.firstName || !formData.email || !formData.password) {
            setError('Please fill in all mandatory fields.');
            setIsLoading(false);
            return;
        }

        try {
            // NOTE: Replace '/api' with your actual API base URL in production, e.g., 'https://momentum-api.com/api/v1/auth/signup'
            const response = await fetch('/api/v1/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok || data.status === 'fail' || data.status === 'error') {
                // Handle API errors (e.g., 409 Conflict for duplicate email)
                const message = data.message || 'An unknown error occurred during sign-up.';
                setError(message);
                setIsLoading(false);
                return;
            }

            // Success logic
            setSuccess(true);

            // In a real app, we would store the JWT token (data.token) and redirect.
            // For this step, we simulate success and redirect to the dashboard/home.
            setTimeout(() => {
                // Redirect to a dashboard or a success page
                router.push('/dashboard');
            }, 1500);

        } catch (err) {
            console.error('Network or unexpected error:', err);
            setError('A network error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    // --- Reusable Input Component ---
    const FormInput = ({ id, name, type = 'text', label, Icon, placeholder }: {
        id: string;
        name: keyof FormState;
        type?: string;
        label: string;
        Icon: React.ElementType;
        placeholder: string;
    }) => (
        <div className="space-y-1">
            {/* Label Styling (Source: Style Guide, 5. Component Design, Forms) */}
            <label htmlFor={id} className="block text-sm font-medium text-text-secondary">
                {label}
            </label>
            <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    {/* Icon using Lucide */}
                    <Icon className="h-5 w-5 text-text-secondary" aria-hidden="true" />
                </div>
                <input
                    id={id}
                    name={name}
                    type={type}
                    value={formData[name]}
                    onChange={handleInputChange}
                    required
                    placeholder={placeholder}
                    // Input Field Styling (Source: Style Guide, 5. Component Design, Forms)
                    className="block w-full rounded-md border border-border-subtle p-3 pl-10 text-text-primary bg-bg-surface
                     placeholder:text-text-secondary/70 focus:border-action-primary focus:ring-action-primary transition duration-150 sm:text-sm"
                />
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-lg">
            <h2 className="text-3xl font-semibold text-text-primary text-center mb-6">
                Sign Up for Momentum
            </h2>

            {/* Status Indicators */}
            {error && (
                <div className="mb-4 flex items-center p-4 bg-signal-alert/10 text-signal-alert rounded-lg border border-signal-alert/30">
                    <AlertTriangle className="w-5 h-5 mr-3" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}
            {success && (
                <div className="mb-4 flex items-center p-4 bg-signal-success/10 text-signal-success rounded-lg border border-signal-success/30">
                    <CheckCircle className="w-5 h-5 mr-3" />
                    <p className="text-sm font-medium">Success! Redirecting you now...</p>
                </div>
            )}

            {/* Sign Up Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <FormInput
                    id="firstName"
                    name="firstName"
                    type="text"
                    label="Your First Name"
                    Icon={User}
                    placeholder="e.g., Jessica"
                />

                <FormInput
                    id="email"
                    name="email"
                    type="email"
                    label="Email Address"
                    Icon={Mail}
                    placeholder="you@example.com"
                />

                <FormInput
                    id="password"
                    name="password"
                    type="password"
                    label="Password"
                    Icon={Lock}
                    placeholder="Min. 8 characters"
                />

                {/* Primary Button: Sign Up */}
                <div>
                    <button
                        type="submit"
                        disabled={isLoading || success}
                        // Uses Mandated Primary Button Styling (Source: Style Guide, 5. Component Design)
                        className={`w-full flex justify-center items-center rounded-lg py-3 px-4 text-base font-medium shadow-sm 
                        text-white transition-all duration-200 
                        ${isLoading || success ? 'bg-action-primary/60 cursor-not-allowed' : 'bg-action-primary hover:bg-action-hover transform hover:scale-[1.005] focus:ring-4 focus:ring-action-primary/50'}`}
                    >
                        {isLoading && <Loader className="w-5 h-5 mr-2 animate-spin" />}
                        {success ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </div>
            </form>

            {/* Auxiliary Link */}
            <p className="mt-6 text-center text-sm text-text-secondary">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-action-primary hover:text-action-hover">
                    Login here
                </Link>
            </p>
        </div>
    );
};

export default SignUpForm;