const CONFIG = {
    // API_URL: 'https://script.google.com/macros/s/AKfycbyBqN4Z6q5mTJXaa8UzpqCbYN1EetEajERpk6CQSfNw6eUXJQPhgwDh9-xSooH5f3be/exec',
    API_URL: 'https://script.google.com/macros/s/AKfycbyBqN4Z6q5mTJXaa8UzpqCbYN1EetEajERpk6CQSfNw6eUXJQPhgwDh9-xSooH5f3be/exec',
    CURRENCY: 'Rs.',
    DATE_FORMAT: 'en-GB' // DD/MM/YYYY
};

const COURIERS = [
    "Pakistan Post (VPL)",
    "TCS",
    "Leopards",
    "M&P",
    "Call Courier",
    "Trax",
    "Rider",
    "BlueEx"
];

const STATUSES = {
    BOOKED: "Order Booked",
    OUT_FOR_DELIVERY: "Out for Delivery",
    DELIVERY_OFFICE: "Delivery Office",
    DELIVERED: "Delivered",
    RETURN: "Return",
    READY_FOR_RETURN: "Ready for Return"
};

const STATUS_COLORS = {
    "Order Booked": "#3b82f6", // Blue
    "Out for Delivery": "#f59e0b", // Amber/Yellow
    "Delivery Office": "#8b5cf6", // Violet (Distinct from Blue)
    "Delivered": "#10b981", // Emerald
    "Return": "#ef4444", // Red
    "Ready for Return": "#ec4899", // Pink (Distinct from Red)
    "Returned": "#ef4444",
    "Pending": "#6b7280",
    "Cancelled": "#9ca3af"
};
