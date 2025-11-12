// =========================================================
// silkpanda/momentum/momentum-aed7f8804ec93e3a89b85f13a44796c67e349b99/app/components/auth/SignUpForm.tsx
// REFACTORED to meet new API (v3) signup requirements
// =========================================================
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, AlertTriangle, Loader, CheckCircle, Home, Palette, CheckIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import FormInput from '../layout/FormInput'; // Using your corrected path

// Interface for the form state
interface FormState {
    firstName: string;
    lastName: string; // ADDED
    email: string;
    password: string;
    householdName: string; // ADDED
    userDisplayName: string; // ADDED
}

// Profile colors from Governance Doc
const PROFILE_COLORS = [
    { name: 'Blueberry', hex: '#4285F4' }, { name: 'Celtic Blue', hex: '#1967D2' },
    { name: 'Selective Yellow', hex: '#FBBC04' }, { name: 'Pigment Red', hex: '#F72A25' },
    { name: 'Sea Green', hex: '#34A853' }, { name: 'Dark Spring Green', hex: '#188038' },
    { name: 'Tangerine', hex: '#FF8C00' }, { name: 'Grape', hex: '#8E24AA' },
    { name: 'Flamingo', hex: '#E67C73' }, { name: 'Peacock', hex: '#039BE5' },
];

const SignUpForm: React.FC = () => {
    const [formData, setFormData] = useState<FormState>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        householdName: '',
        userDisplayName: '',
    });
    // Add state for color picker
    const [selectedColor, setSelectedColor] = useState<string>(PROFILE_COLORS[0].hex);
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

        // Update validation to check all new fields
        if (
            !formData.firstName || !formData.lastName || !formData.email ||
            !formData.password || !formData.householdName || !formData.userDisplayName
        ) {
            setError('Please fill in all fields.');
            setIsLoading(false);
            return;
        }

        try {
            //
            const response = await fetch('/api/v1/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    userProfileColor: selectedColor, // Add the selected color
                }),
            });

            const data = await response.json();

            if (!response.ok || data.status === 'fail' || data.status === 'error') {
                const message = data.message || 'An unknown error occurred during sign-up.';
                setError(message);
                setIsLoading(false);
                return;
            }

            // Success logic
            setSuccess(true);

            // Save the token from the response
            if (data.token) {
                localStorage.setItem('momentum_token', data.token);
            }

            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);

        } catch (err) {
            console.error('Network or unexpected error:', err);
            setError('A network error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-lg">
            <h2 className="text-3xl font-semibold text-text-primary text-center mb-6">
                Create Your Household
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput
                        id="firstName"
                        name="firstName"
                        type="text"
                        label="Your First Name"
                        Icon={User}
                        placeholder="e.g., Jessica"
                        value={formData.firstName}
                        onChange={handleInputChange}
                    />

                    {/* Add lastName Input */}
                    <FormInput
                        id="lastName"
                        name="lastName"
                        type="text"
                        label="Your Last Name"
                        Icon={User}
                        placeholder="e.g., Smith"
                        value={formData.lastName}
                        onChange={handleInputChange}
                    />
                </div>

                {/* Add householdName Input */}
                <FormInput
                    id="householdName"
                    name="householdName"
                    type="text"
                    label="Household Name"
                    Icon={Home}
                    placeholder="e.g., 'The Smith Family'"
                    value={formData.householdName}
                    onChange={handleInputChange}
                />

                {/* Add userDisplayName Input */}
                <FormInput
                    id="userDisplayName"
                    name="userDisplayName"
                    type="text"
                    label="Your Display Name"
                    Icon={User}
                    placeholder="e.g., 'Mom' or 'Jessica'"
                    value={formData.userDisplayName}
                    onChange={handleInputChange}
                />

                <FormInput
                    id="email"
                    name="email"
                    type="email"
                    label="Email Address"
                    Icon={Mail}
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                />

                <FormInput
                    id="password"
                    name="password"
                    type="password"
                    label="Password"
                    Icon={Lock}
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={handleInputChange}
                />

                {/* Add Color Picker */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-text-secondary">
                        Your Profile Color
                    </label>
                    <div className="flex flex-wrap gap-2 p-2 bg-bg-canvas rounded-lg border border-border-subtle">
                        {PROFILE_COLORS.map((color) => (
                            <button
                                type="button"
                                key={color.hex}
                                title={color.name}
                                onClick={() => setSelectedColor(color.hex)}
                                className={`w-8 h-8 rounded-full border-2 transition-all
                          ${selectedColor === color.hex ? 'border-action-primary ring-2 ring-action-primary/50 scale-110' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                style={{ backgroundColor: color.hex }}
                            >
                                {selectedColor === color.hex && <CheckIcon className="w-5 h-5 text-white m-auto" />}
                            </button>
                        ))}
                    </div>
                </div>
                {/* --- End of new fields --- */}

                {/* Primary Button: Sign Up */}
                <div>
                    <button
                        type="submit"
                        disabled={isLoading || success}
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