import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
        },

        type: {
            type: String,
            required: true},
        metadata: {
            type: Object,
            default: {},
        },

        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        versionKey: false,
    }
);

export const Activity = mongoose.model("Activity", ActivitySchema);
