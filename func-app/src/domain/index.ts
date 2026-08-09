/**
 * The func domain layer.
 *
 * Pure business rules. No React, no React Native, no storage, no network, no
 * platform APIs — nothing here may import from outside this folder. That is
 * what makes it testable without a simulator, and what stops the product rules
 * from being welded to a UI framework the way the prototype's were.
 */

export * from './clock';
export * from './geography';
export * from './ids';
export * from './presence';
export * from './visibility';
