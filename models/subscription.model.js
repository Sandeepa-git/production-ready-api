import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subscription name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  price: {
    type: Number,
    required: [true, 'Subscription price is required'],
    min: [0, 'Price must be greater than or equal to 0'],
  },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'LKR'],
    default: 'USD'
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true
  },
  category: {
    type: String,
    enum: ['basic', 'premium', 'enterprise', 'entertainment'],
    required: [true, 'Subscription category is required'],
  },
  paymentMethod: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'canceled', 'expired'],
    default: 'active',
  },
  startDate: {
    type: Date,
    required: true,
    validate: {
      validator: (value) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(value);
        start.setHours(0, 0, 0, 0);
        return start >= today;
      },
      message: 'Start date must be today or in the future',
    }
  },
  renewalDate: {
    type: Date,
    validate: {
      validator: function (value) {
        return !value || value > this.startDate;
      },
      message: 'Renewal date must be after the start date',
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  }
}, { timestamps: true });

// Normalize category to lowercase before validation
subscriptionSchema.pre('validate', function () {
  if (this.category) this.category = this.category.toLowerCase();
});

// Auto calculate renewal date if missing
subscriptionSchema.pre('save', function () {
  const renewalPeriods = { daily: 1, weekly: 7, monthly: 30, yearly: 365 };

  if (!this.renewalDate) {
    if (!this.frequency || !renewalPeriods[this.frequency]) {
      throw new Error('Invalid frequency for subscription');
    }
    this.renewalDate = new Date(this.startDate);
    this.renewalDate.setDate(this.renewalDate.getDate() + renewalPeriods[this.frequency]);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewal = new Date(this.renewalDate);
  renewal.setHours(0, 0, 0, 0);

  if (renewal < today) this.status = 'expired';
});


const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
