import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Button,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useContext, useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
// import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityIndicator } from "react-native-paper";
import { StyleSheet } from "react-native";
import { AxiosContext } from "../../context/AxiosContext";
import { useIsFocused } from "@react-navigation/native";
import { AlertDialog, Center } from "native-base";
import NotiDialog from "../../components/NotiDialog";
import { formatNumber } from "../../utils/NumberFormatter";
import moment from "moment";
import * as querystring from "qs";

const Payment = ({ route, navigation }: any) => {
  const [paymentStatus, setPaymentStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const link = route?.params?.url;

  const [isOpenDialog, setIsOpenDialog] = useState<boolean>(false);
  const [isOpenSuccessDialog, setIsOpenSuccessDialog] =
    useState<boolean>(false);
  const voucherId = route?.params?.voucherId;
  const goBackClearEventListener = useCallback(() => {
    Linking.removeAllListeners("url");
    navigation.goBack();
  }, [""]);
  if (!voucherId) {
    // Alert.alert("Error", "Please select a voucher to buy");
    goBackClearEventListener();
  }
  // const transactionId = route.params.transactionId?.replace(/-/g, "");
  const quantity = route?.params?.amount;
  const { image, voucherName, price } = route?.params;
  const userId = route?.params?.userId;
  const giftUserId = route?.params?.giftUserId;
  const { authAxios, publicAxios } = useContext(AxiosContext);

  const createInvoice = async (userId, voucherId, quantity, giftUserId) => {
    if (renderTime > 0) return;
    try {
      console.log("--------------------------------------");
      console.log("voucherId", voucherId);
      console.log("quantity", quantity);

      const res = await publicAxios.post(`/invoices`, {
        userId,
        quantity,
        voucherId,
        giftUserId,
      });
      console.log("---------------create invoice", res.data);

      return res;
    } catch (error) {
      console.log(error);
    }
  };

  const checkPaidVNPay = async (queryParams) => {
    try {
      const result = await publicAxios.post(
        `/vnpay/get-payment?${queryParams}`
      );
      console.log("----get-payment", result.data);
      return result;
    } catch (error) {
      console.log(error);
    }
  };

  const handleNormalPaymentStatus = async (paymentMethod, orderData) => {
    setIsLoading(true);

    if (paymentMethod === "VNPay") {
      try {
        const {
          vnp_Amount,
          vnp_BankCode,
          vnp_BankTranNo,
          vnp_CardType,
          vnp_OrderInfo,
          vnp_PayDate,
          vnp_ResponseCode,
          vnp_TmnCode,
          vnp_TransactionNo,
          vnp_TransactionStatus,
          vnp_TxnRef,
          vnp_SecureHash,
        } = orderData;
        const queryParams = `vnp_Amount=${vnp_Amount}&vnp_BankCode=${vnp_BankCode}&vnp_BankTranNo=${vnp_BankTranNo}&vnp_CardType=${vnp_CardType}&vnp_OrderInfo=${encodeURIComponent(
          vnp_OrderInfo
        )}&vnp_PayDate=${vnp_PayDate}&vnp_ResponseCode=${vnp_ResponseCode}&vnp_TmnCode=${vnp_TmnCode}&vnp_TransactionNo=${vnp_TransactionNo}&vnp_TransactionStatus=${vnp_TransactionStatus}&vnp_TxnRef=${vnp_TxnRef}&vnp_SecureHash=${vnp_SecureHash}`;
        checkPaidVNPay(queryParams).then((res) => {
          console.log("1111111111", res.status, res.data);
          if (res.status >= 200 && res.status < 300) {
            createInvoice(userId, voucherId, quantity, giftUserId).then(
              (res) => {
                if (res.status >= 200 && res.status < 300) {
                  setIsLoading(false);
                  console.log("000000000", res.status, res.data);
                  // navigation.navigate("Inventory");
                }
              }
            );
          }
        });
      } catch (error) {
        setIsLoading(false);
        setIsOpenDialog(true);
        console.log(error);
      }
    }
  };

  const handleDeepLink = (event) => {
    const url = new URL(event.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    console.log("--------deeplink", queryParams?.vnp_ResponseCode);

    if (queryParams && queryParams["vnp_TransactionStatus"] === "00") {
      handleNormalPaymentStatus("VNPay", queryParams);
      Linking.removeAllListeners("url");
      setIsOpenSuccessDialog(true);
    }
    // Failed.
    if (
      queryParams["message"] == "Transaction denied by user." ||
      queryParams["vnp_ResponseCode"] == "24"
    ) {
      Linking.removeAllListeners("url");
      setIsOpenDialog(true);
    }
  };

  const isFocus = useIsFocused();

  const [renderTime, setRenderTime] = useState(0);
  useEffect(() => {
    if (renderTime === 0) Linking.addEventListener("url", handleDeepLink);
    setRenderTime(renderTime + 1);
  }, [""]);

  const [voucher, setVoucher] = useState<any>(null);

  useEffect(() => {
    const getVoucher = async () => {
      setIsLoading(true);
      try {
        const res = await authAxios.get(`/vouchers/${voucherId}`);
        console.log("voucher", res.data);
        setVoucher(res.data);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        console.log(error);
      }
    };
    getVoucher();
  }, [isFocus]);

  if (isLoading) {
    return (
      <Center>
        <ActivityIndicator size="large" />
      </Center>
    );
  } else
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#004165",
        }}
      >
        <View style={styles.container}>
          <View style={styles.ticketContainer}>
            <View style={styles.topSection}>
              <View style={styles.voucherInfo}>
                <Image
                  style={{
                    width: 100,
                    height: 70,
                  }}
                  alt="voucher image"
                  source={{ uri: voucher?.imageUrl }}
                />

                <View style={styles.discountInfo}>
                  <Text style={styles.discountText}>
                    {voucher?.discount}
                    <Text>
                      {voucher?.discountType === "percentage"
                        ? "% OFF"
                        : "K OFF"}
                    </Text>
                  </Text>
                  <Text style={{ fontSize: 20, width: 180 }}>
                    {voucher?.name}
                  </Text>
                </View>
              </View>
              <View style={styles.voucherDes}>
                <Text style={styles.descriptionText}>
                  {voucher?.description}
                </Text>
                <Text
                  style={{ fontSize: 20, fontWeight: "500", marginTop: 15 }}
                >
                  Condition:
                </Text>
                <View style={styles.conditionList}>
                  {voucher?.condition?.map((data, index) => {
                    return (
                      <View
                        key={index}
                        style={{ flexDirection: "row", gap: 2 }}
                      >
                        <Text>{"\u2022"}</Text>

                        <Text style={styles.conditionText}>{` ${data}`}</Text>
                      </View>
                    );
                  })}
                  <Text
                    style={{ marginTop: 10, fontSize: 16, fontWeight: "bold" }}
                  >
                    Valid From:{" "}
                    {moment(voucher?.startUseTime).format("Do MMM YY")} -{" "}
                    {moment(voucher?.endUseTime).format("Do MMM YY")}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.bottomSection}>
              <View style={styles.before}></View>
              <View style={styles.after}></View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-around",
                  gap: 40,
                }}
              >
                <Text style={{ fontSize: 15 }}>
                  Unit price: {formatNumber(voucher?.price)}
                </Text>
                <Text>x</Text>
                <Text style={{ fontSize: 15 }}>
                  {quantity} {quantity > 1 ? "vouchers" : "voucher"}
                </Text>
              </View>
              <Text style={styles.price}>
                Total: {formatNumber(quantity * price)} VND
              </Text>

              <Text style={styles.paymentMethodText}>
                You will be redirect to VNPAY gateway to pay your order
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Button
                  title="Cancel payment"
                  color={"grey"}
                  onPress={() => goBackClearEventListener()}
                />
                <Button
                  title="Continue to pay"
                  onPress={() => WebBrowser.openBrowserAsync(link)}
                />
              </View>
            </View>
          </View>
        </View>

        {isOpenDialog && (
          <NotiDialog
            navigateFunc={() => goBackClearEventListener()}
            navigation={navigation}
            isOpenDialog={isOpenDialog}
            setIsOpenDialog={setIsOpenDialog}
            title={"Alert"}
            message={"Payment is failed. Please try again."}
          />
        )}
        {isOpenSuccessDialog && (
          <NotiDialog
            navigateFunc={() => navigation.navigate("Inventory")}
            navigation={navigation}
            isOpenDialog={isOpenSuccessDialog}
            setIsOpenDialog={setIsOpenSuccessDialog}
            title={"Success"}
            message={"Payment successfully. You will be redirect to Inventory."}
          />
        )}
      </View>
    );
};

export default Payment;

const styles = StyleSheet.create({
  normalPaymentContainer: {
    padding: 20,
    backgroundColor: "#f9f9f9",
    margin: 10,
    borderRadius: 10,
  },
  paymentMethodText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  container: {
    flex: 1,
    backgroundColor: "#004165",
    alignItems: "center",
  },

  ticketContainer: {
    width: 360,
    height: 630,
    backgroundColor: "#FBFBFB",
    borderRadius: 12,
    paddingVertical: 20,
    marginTop: 50,
  },

  topSection: {
    paddingHorizontal: 20,
    flex: 1,
  },

  voucherInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 30,
  },

  discountInfo: {},

  discountText: {
    fontSize: 24,
    fontWeight: "500",
    lineHeight: 30, // Adjust line height as needed
  },

  voucherDes: {
    marginTop: 30,
    paddingHorizontal: 10,
  },

  conditionList: {
    gap: 10,
    fontWeight: "400",
    marginTop: 10,
  },

  descriptionText: {
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "auto",
  },

  conditionText: {
    fontSize: 16,
  },

  bottomSection: {
    flex: 0.45,
    marginTop: 10,
    borderTopWidth: 3,
    borderStyle: "dashed",
    position: "relative",
    marginHorizontal: 30,
    borderColor: "#66666633",
    alignItems: "center",
    paddingVertical: 20,
    gap: 20,
  },
  before: {
    position: "absolute",
    top: -20,
    left: -50,
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: "#004165",
  },

  after: {
    position: "absolute",
    top: -20,
    right: -50,
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: "#004165",
  },

  price: {
    fontSize: 30,
    lineHeight: 30,
    fontWeight: "600",
    marginRight: 7,
  },

  buttonSection: {
    alignItems: "center",
    gap: 10,
  },

  button: {
    width: 200,
    paddingVertical: 20,
    borderRadius: 100,
    backgroundColor: "#5BBCFF",
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },

  backContainer: {
    marginTop: 50,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
});
