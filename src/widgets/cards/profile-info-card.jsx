
import PropTypes from "prop-types";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
} from "@material-tailwind/react";

export function ProfileInfoCard({ title, description, details, action }) {
  return (
    <Card color="white" shadow={true} className="rounded-xl border border-gray-100">
      <CardHeader
        color="transparent"
        shadow={false}
        floated={false}
        className="mx-0 mt-0 mb-0 flex items-center justify-between gap-4 p-5 border-b border-gray-100"
      >
        <Typography variant="h6" color="blue-gray" className="font-semibold">
          {title}
        </Typography>
        {action}
      </CardHeader>
      <CardBody className="p-5">
        {description && (
          <Typography
            variant="small"
            className="font-normal text-blue-gray-500"
          >
            {description}
          </Typography>
        )}
        {description && details ? (
          <hr className="my-5 border-blue-gray-50" />
        ) : null}
        {details && (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 p-0">
            {Object.keys(details).map((el, key) => (
              <li key={key} className="flex items-start gap-3">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-semibold capitalize w-32 shrink-0"
                >
                  {el}:
                </Typography>
                {typeof details[el] === "string" ? (
                  <Typography
                    variant="small"
                    className="font-medium text-blue-gray-700"
                  >
                    {details[el]}
                  </Typography>
                ) : (
                  details[el]
                )}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}


ProfileInfoCard.defaultProps = {
  action: null,
  description: null,
  details: {},
};


ProfileInfoCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.node,
  details: PropTypes.object,
  action: PropTypes.node,
};


ProfileInfoCard.displayName = "/src/widgets/cards/profile-info-card.jsx";


export default ProfileInfoCard;
