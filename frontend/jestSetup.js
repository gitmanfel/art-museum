jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), { virtual: true });
jest.mock('@stripe/stripe-react-native', () => ({
	StripeProvider: ({ children }) => children,
	useStripe: () => ({
		initPaymentSheet: jest.fn().mockResolvedValue({}),
		presentPaymentSheet: jest.fn().mockResolvedValue({}),
	}),
}));
