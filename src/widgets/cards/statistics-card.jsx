import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Typography,
} from "@material-tailwind/react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

export function StatisticsCard({ color, icon, title, value, footer }) {
  return (
    <Card className="border border-blue-gray-100 shadow-sm">
      <CardHeader
        variant="gradient"
        color={color}
        floated={false}
        shadow={false}
        className="absolute grid h-12 w-12 place-items-center"
      >
        {icon}
      </CardHeader>
      <CardBody className="p-4 text-right">
        <Typography variant="small" className="font-normal text-blue-gray-600">
          {title}
        </Typography>

        
        <Typography variant="h4" color="blue-gray">
          {value}
        </Typography>
        

      </CardBody>
      {footer && (
        /*<CardFooter className="border-t border-blue-gray-50 p-4">
          {footer}
        </CardFooter>*/
        <CardFooter className="border-t border-blue-gray-50 p-4">
          {/* NOW WE BUILD THE FOOTER CONTENT WITH THE LINK HERE */}
          <Typography className="font-normal text-blue-gray-600">
            {footer.path ? ( // Check if footer.path exists
              <Link
                to={footer.path} // Use the path from the footer object
                className={`font-normal ${footer.color} hover:underline cursor-pointer`} // Add styling for link appearance
              >
                <strong className={footer.color}>{footer.value}</strong>
                &nbsp;{footer.label}
              </Link>
            ) : (
              // If no path, render just the strong and label without a link
              <>
                <strong className={footer.color}>{footer.value}</strong>
                &nbsp;{footer.label}
              </>
            )}
          </Typography>
        </CardFooter>
        
      )}
    </Card>
  );
}

StatisticsCard.defaultProps = {
  color: "blue",
  footer: null,
};

StatisticsCard.propTypes = {
  color: PropTypes.oneOf([
    "white",
    "blue-gray",
    "gray",
    "brown",
    "deep-orange",
    "orange",
    "amber",
    "yellow",
    "lime",
    "light-green",
    "green",
    "teal",
    "cyan",
    "light-blue",
    "blue",
    "indigo",
    "deep-purple",
    "purple",
    "pink",
    "red",
  ]),
  icon: PropTypes.node.isRequired,
  title: PropTypes.node.isRequired,
  value: PropTypes.node.isRequired,
  footer: PropTypes.node,
};

StatisticsCard.displayName = "/src/widgets/cards/statistics-card.jsx";

export default StatisticsCard;
