import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#4CA1AF',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    marginHorizontal: 10,
  },
  form: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 50,
  },
  text: {
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  card: {
    height: 150,
    width: 100,
    backgroundColor: '#BFBFBF',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardRed: {
    color: 'red',
  },
  cardsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputBet: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

export default styles;
