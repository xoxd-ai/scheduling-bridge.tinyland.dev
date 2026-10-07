import { Cause, Exit, Schema } from 'effect';

/**
 * Build a `Schema.decodeUnknownEffect(schema)` decoder (Effect 4 name for the
 * Effect 3 `Schema.decodeUnknown`). Returns an Effect that yields the decoded
 * `Type` or fails with a `SchemaError`.
 */
export const decode = <S extends Schema.Constraint>(schema: S) => Schema.decodeUnknownEffect(schema);

/**
 * Decode an unknown input synchronously and throw on failure. Intended for
 * build-time content ingestion where a malformed input should halt the build.
 */
export const decodeOrThrow =
	<S extends Schema.ConstraintDecoder<unknown>>(schema: S) =>
	(input: unknown): S['Type'] =>
		Schema.decodeUnknownSync(schema)(input);

/** Pretty-print an `Exit` failure cause for logging / build output. */
export const formatExit = <A, E>(exit: Exit.Exit<A, E>): string =>
	Exit.isSuccess(exit) ? 'ok' : Cause.pretty(exit.cause);
