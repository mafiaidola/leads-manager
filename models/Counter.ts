import mongoose, { Schema, Model, models } from "mongoose";

export interface ICounter {
    _id: string;
    seq: number;
}

const CounterSchema = new Schema<ICounter>({
    _id: { type: String, required: true },
    seq: { type: Number, default: 1000 },
});

const Counter: Model<ICounter> =
    models.Counter || mongoose.model<ICounter>("Counter", CounterSchema);

/**
 * Atomically increment and return the next sequence value.
 * First call seeds at 1001.
 */
export async function getNextSequence(name: string): Promise<number> {
    const counter = await Counter.findByIdAndUpdate(
        name,
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return counter!.seq;
}

/**
 * Atomically reserve a batch of sequential IDs.
 * Returns the FIRST id in the batch. IDs = [first, first+1, ..., first+count-1].
 */
export async function getNextSequenceBatch(
    name: string,
    count: number
): Promise<number> {
    const counter = await Counter.findByIdAndUpdate(
        name,
        { $inc: { seq: count } },
        { new: true, upsert: true }
    );
    // counter.seq is now the LAST id. First = last - count + 1.
    return counter!.seq - count + 1;
}

export default Counter;
