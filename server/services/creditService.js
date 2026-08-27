import UserAccount from '../models/UserAccount.js';
import CreditTransaction from '../models/CreditTransaction.js';

export const DIAGRAM_COST = 50;

export async function getOrCreateAccount(user) {
  return UserAccount.findOneAndUpdate(
    { uid: user.uid },
    { $setOnInsert: { uid: user.uid, credits: 100 }, $set: { email: user.email || '', name: user.name || '' } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

export async function reserveDiagramCredits(user) {
  await getOrCreateAccount(user);
  const account = await UserAccount.findOneAndUpdate(
    { uid: user.uid, credits: { $gte: DIAGRAM_COST } },
    { $inc: { credits: -DIAGRAM_COST } },
    { new: true }
  );
  if (!account) {
    const current = await UserAccount.findOne({ uid: user.uid }).lean();
    const error = new Error(`Insufficient credits. You have ${current?.credits || 0} credits; ${DIAGRAM_COST} are required.`);
    error.statusCode = 402;
    throw error;
  }
  await CreditTransaction.create({ uid: user.uid, type: 'generation', credits: -DIAGRAM_COST });
  return account;
}

export async function refundDiagramCredits(user, reference) {
  const account = await UserAccount.findOneAndUpdate({ uid: user.uid }, { $inc: { credits: DIAGRAM_COST } }, { new: true });
  await CreditTransaction.create({ uid: user.uid, type: 'refund', credits: DIAGRAM_COST, reference });
  return account;
}

export async function addPurchasedCredits(uid, credits, reference, metadata = {}) {
  const account = await UserAccount.findOneAndUpdate({ uid }, { $inc: { credits } }, { new: true, upsert: true, setDefaultsOnInsert: true });
  await CreditTransaction.create({ uid, type: 'purchase', credits, reference, metadata });
  return account;
}
