import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Card, Header, Icon } from 'react-native-elements';
import firebase from 'firebase';
import db from '../config';

export default class ReceiverDetailsScreen extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userId: firebase.auth().currentUser.email,
            receiverId: this.props.navigation.getParam('details')['user_id'],
            requestId: this.props.navigation.getParam('details')['request_id'],
            thingName: this.props.navigation.getParam('details')['thing_name'],
            reasonForRequesting: this.props.navigation.getParam('details')['reason_to_request'],
            requestId: this.props.navigation.getParam('details')['request_id'],
            exchangeVal: "",
            receiverCountryCurrencyCode: "",
            receiverName: '',
            receiverContact: '',
            receiverAddress: '',
            receiverRequestDocId: '',
            username: '',
            donorCountryCurrencyCode: '',
            value: ''
        }
    }

    getReceiverDetails = async () => {
        await db.collection('users').where('email_id', '==', this.state.receiverId).get().then((snapshot) => {
            snapshot.forEach((doc) => {
                this.setState({
                    receiverName: doc.data().first_name,
                    receiverContact: doc.data().contact,
                    receiverAddress: doc.data().address,
                    receiverCountryCurrencyCode: doc.data().country_currency_code
                });
            });

            console.log(this.state.receiverCountryCurrencyCode);
        });

        await db.collection('requested_things').where('request_id', '==', this.state.requestId).get().then((snapshot) => {
            snapshot.forEach((doc) => {
                this.setState({
                    receiverRequestDocId: doc.id,
                    value: doc.data().value
                });

                console.log("Item Value 👌: " + this.state.value);
            });
        });
    }

    getUserDetails = async () => {
        await db.collection("users").where('email_id','==', this.state.userId).get().then((snapshot)=>{
            snapshot.forEach((doc) => {
                this.setState({
                    username: doc.data().first_name + " " + doc.data().last_name,
                    donorCountryCurrencyCode: doc.data().country_currency_code
                });
            });

            this.getData();
        });
    }

    updateThingStatus = async () => {
        await db.collection('all_barters').add({
            thing_name: this.state.thingName,
            request_id: this.state.requestId,
            requested_by: this.state.receiverName,
            donor_id: this.state.userId,
            request_status: 'Donor Interested'
        });
    }

    addNotification = async () => {
        var message = this.state.username + 'has shown interest in donating your requested item';
        await db.collection('all_notifications').add({
            'targeted_user_id': this.state.receiverId,
            'donor_id': this.state.userId,
            'request_id': this.state.requestId,
            'thing_name': this.state.thingName,
            'date': firebase.firestore.FieldValue.serverTimestamp(),
            'notification_status': 'unread',
            'message': message
        });
    }

    getData = async () => {
        const data = await fetch("http://data.fixer.io/api/latest?access_key=d9f90a6f7fbc2b543415ef8a2a82ef23&format=1")
        .then((response) => {
            return response.json();
        }).then((responseData) => {
            var receiverCountryCurrencyCode = this.state.receiverCountryCurrencyCode;
            var donorCountryCurrencyCode = this.state.donorCountryCurrencyCode;
            
            console.log("Receiver Country Currency Code: " + receiverCountryCurrencyCode, "Donor Country Currency Code: " + donorCountryCurrencyCode);

            var currency = responseData.rates;

            var euroEquiValInRecCurrencyCode = currency[receiverCountryCurrencyCode];
            console.log(euroEquiValInRecCurrencyCode + ": euroEquiValInRecCurrencyCode");

            var costInEuro = this.state.value/euroEquiValInRecCurrencyCode;
            console.log(costInEuro + ": costInEuro");

            var euroEquiValDonorCurrencyCode = currency[donorCountryCurrencyCode];
            var costInDonorCurrency = costInEuro * euroEquiValDonorCurrencyCode;
            var correctValue = costInDonorCurrency.toFixed(2);
            var finalValue = correctValue + " " +this.state.donorCountryCurrencyCode;

            console.log(finalValue + ": costInDonorCurrency");

            this.setState({
                exchangeVal: finalValue
            });

            console.log("Exchange Value: ", this.state.exchangeVal);
        });
    }

    componentDidMount(){
        this.getReceiverDetails();
        this.getUserDetails();
        this.getData();    
    }

    render() {
        return (
            <ScrollView>
                <View style={styles.container}>
                    <View>
                        <Card title={`Requested Thing's information`}>
                            <Card>
                                <Text style={{fontWeight: 'bold'}}>
                                    Name: {this.state.thingName}
                                </Text>
                            </Card>

                            <Card>
                                <Text style={{fontWeight: 'bold'}}>
                                    Reason to request: {this.state.reasonForRequesting}
                                </Text>
                            </Card>

                            <Card>
                                <Text style={{fontWeight: 'bold'}}>
                                    Value: {this.state.exchangeVal}
                                </Text>
                            </Card>
                        </Card>
                    </View>

                    <View>
                        <Card title = {'Receiver Information'} titleStyle = {{fontSize: 20}}> 
                            <Card>
                                <Text style={{fontWeight: 'bold'}}>
                                    Name: {this.state.receiverName}
                                </Text>
                            </Card>

                            <Card>
                                <Text style={{fontWeight: 'bold'}}>
                                    Contact: {this.state.receiverContact}
                                </Text>
                            </Card>

                            <Card>
                                <Text style={{fontWeight: 'bold'}}>
                                    Address: {this.state.receiverAddress}
                                </Text>
                            </Card>
                        </Card>
                    </View>

                    <View style={styles.buttonContainer}>
                        {this.state.receiverId !== this.state.userId ? (
                            <TouchableOpacity 
                                style={styles.button}
                                onPress={() => {
                                    this.updateThingStatus();
                                    this.addNotification();
                                    this.props.navigation.navigate('MyBarters');
                                }}
                            >
                                <Text>I want to exchange</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
      flex:1,
    },
    buttonContainer : {
      flex:0.3,
      justifyContent:'center',
      alignItems:'center'
    },
    button:{
      width:200,
      height:50,
      justifyContent:'center',
      alignItems : 'center',
      borderRadius: 10,
      backgroundColor: 'orange',
      shadowColor: "#000",
      shadowOffset: {
         width: 0,
         height: 8
       },
      elevation : 16,
      marginTop: 35
    }
});