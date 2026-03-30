jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({
	API: {
		setWaitingForIdentifier: jest.fn(),
		unsetWaitingForIdentifier: jest.fn(),
	},
}), { virtual: true });

jest.mock('react-native/Libraries/Animated/nodes/AnimatedValueXY', () => {
	const actualAnimated = jest.requireActual('react-native/Libraries/Animated');
	return actualAnimated.Animated.ValueXY;
}, { virtual: true });

jest.mock('@stripe/stripe-react-native', () => ({
	StripeProvider: ({ children }) => children,
	useStripe: () => ({
		initPaymentSheet: jest.fn().mockResolvedValue({}),
		presentPaymentSheet: jest.fn().mockResolvedValue({}),
	}),
}));
