
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="w-full py-6 px-4 mt-auto border-t bg-background/50 backdrop-blur-sm text-sm text-muted-foreground">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                    <p>© {new Date().getFullYear()} KeenQ. All rights reserved.</p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-6">
                    <a
                        href="https://merchant.razorpay.com/policy/RnrVLF84lZPYkq/shipping"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                    >
                        Shipping Policy
                    </a>
                    <a
                        href="https://merchant.razorpay.com/policy/RnrVLF84lZPYkq/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                    >
                        Terms & Conditions
                    </a>
                    <a
                        href="https://merchant.razorpay.com/policy/RnrVLF84lZPYkq/refund"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                    >
                        Cancellation & Refunds
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
