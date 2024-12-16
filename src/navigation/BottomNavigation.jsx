import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/Home/index';
import ProfileScreen from '../screens/Profile/index';
import AudioScreen from '../screens/AudioPlayer';
const Tab = createBottomTabNavigator();

function BottomNavigation() {
  return (
    <Tab.Navigator screenOptions={{
      animation: 'fade',
    }}
>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Audio" component={AudioScreen}   options={{
        tabBarButton: () => null, // Disable the tab button
      }}/>
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default BottomNavigation