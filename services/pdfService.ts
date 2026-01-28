
import { jsPDF } from "jspdf";
import { UserProfile } from "../types";

export const generateInvoice = (user: UserProfile, transactionDate: Date, amount: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Colors
    const primaryColor = "#10b981"; // Green-500
    const black = "#000000";
    const gray = "#71717a";

    // Header
    doc.setFontSize(22);
    doc.setTextColor(primaryColor);
    doc.text("Nych.ai", 20, 20);

    doc.setFontSize(10);
    doc.setTextColor(gray);
    doc.text("Invoice #INV-" + Math.floor(Math.random() * 100000), pageWidth - 20, 20, { align: "right" });
    doc.text("Date: " + transactionDate.toLocaleDateString(), pageWidth - 20, 25, { align: "right" });

    // Bill To
    doc.setFontSize(12);
    doc.setTextColor(black);
    doc.text("Bill To:", 20, 40);
    doc.setFontSize(10);
    doc.setTextColor(gray);
    
    // Name Logic inside PDF
    const namePart = user.email.split('@')[0].replace(/[0-9]/g, '');
    const cleanName = user.full_name || (namePart.charAt(0).toUpperCase() + namePart.slice(1));
    
    doc.text(cleanName, 20, 46);
    doc.text(user.email, 20, 51);

    // Line Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 60, pageWidth - 20, 60);

    // Table Header
    doc.setFontSize(10);
    doc.setTextColor(black);
    doc.setFont("helvetica", "bold");
    doc.text("Description", 20, 70);
    doc.text("Plan Type", 100, 70);
    doc.text("Amount", pageWidth - 20, 70, { align: "right" });

    // Table Row
    doc.setFont("helvetica", "normal");
    doc.setTextColor(gray);
    const planName = user.plan_interval === 'yearly' ? 'Pro Yearly' : 'Pro Monthly';
    doc.text("Nych.ai Subscription", 20, 80);
    doc.text(planName, 100, 80);
    doc.text(amount, pageWidth - 20, 80, { align: "right" });

    // Line Divider
    doc.line(20, 90, pageWidth - 20, 90);

    // Total
    doc.setFontSize(14);
    doc.setTextColor(black);
    doc.setFont("helvetica", "bold");
    doc.text("Total", 140, 105);
    doc.setTextColor(primaryColor);
    doc.text(amount, pageWidth - 20, 105, { align: "right" });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(gray);
    doc.setFont("helvetica", "normal");
    doc.text("Thank you for your business.", 20, 130);
    doc.text("Nych.ai Inc. - Automated Trends Analysis", 20, 135);

    // Save
    doc.save(`nych-invoice-${transactionDate.toISOString().split('T')[0]}.pdf`);
};
