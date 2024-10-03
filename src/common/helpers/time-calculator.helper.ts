export function calculateTimeDifference(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  // Convert latitude and longitude from degrees to radians
  const rad = Math.PI / 180;
  const lat1Rad = lat1 * rad;
  const lon1Rad = lon1 * rad;
  const lat2Rad = lat2 * rad;
  const lon2Rad = lon2 * rad;

  // Calculate the time difference in milliseconds
  const earthRadius = 6371; // Earth's radius in kilometers
  const distance =
    Math.acos(
      Math.sin(lat1Rad) * Math.sin(lat2Rad) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lon2Rad - lon1Rad),
    ) * earthRadius;

  // Assuming average speed of 30 km/h
  const timeDifferenceHours = distance / 20;

  // Convert hours to minutes
  const timeDifferenceMilliseconds = timeDifferenceHours * 60;

  // Get current date
  // const currentDate = new Date();

  // // Calculate the local time difference
  // const localTimeDifference = new Date().getTimezoneOffset() * 60 * 1000;

  // Calculate local time in the destination location
  // const destinationLocalTime = new Date(
  //   currentDate.getTime() + timeDifferenceMilliseconds + localTimeDifference,
  // );

  return { time: timeDifferenceMilliseconds, distance };
}

// Example usage
// const sourceLatitude = 40.7128; // Latitude of source location (New York)
// const sourceLongitude = -74.006; // Longitude of source location (New York)
// const destinationLatitude = 34.0522; // Latitude of destination location (Los Angeles)
// const destinationLongitude = -118.2437; // Longitude of destination location (Los Angeles)

// const destinationLocalTime = calculateTimeDifference(
//   sourceLatitude,
//   sourceLongitude,
//   destinationLatitude,
//   destinationLongitude,
// );
// console.log('Destination local time:', destinationLocalTime);
